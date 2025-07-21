const Store = require('electron-store');
const fetch = require('node-fetch');
const { ipcMain, webContents } = require('electron');
const { PROVIDERS } = require('../ai/factory');

class ModelStateService {
    constructor(authService) {
        this.authService = authService;
        this.store = new Store({ name: 'pickle-glass-model-state' });
        this.state = {};
    }

    initialize() {
        this._loadStateForCurrentUser();

        this.setupIpcHandlers();
        console.log('[ModelStateService] Initialized.');
    }

    _logCurrentSelection() {
        const llmModel = this.state.selectedModels.llm;
        const sttModel = this.state.selectedModels.stt;
        const llmProvider = this.getProviderForModel('llm', llmModel) || 'None';
        const sttProvider = this.getProviderForModel('stt', sttModel) || 'None';
    
        console.log(`[ModelStateService] 🌟 Current Selection -> LLM: ${llmModel || 'None'} (Provider: ${llmProvider}), STT: ${sttModel || 'None'} (Provider: ${sttProvider})`);
    }

    _autoSelectAvailableModels() {
        console.log('[ModelStateService] Running auto-selection for models...');
        const types = ['llm', 'stt'];

        types.forEach(type => {
            const currentModelId = this.state.selectedModels[type];
            let isCurrentModelValid = false;

            if (currentModelId) {
                const provider = this.getProviderForModel(type, currentModelId);
                if (provider && this.getApiKey(provider)) {
                    isCurrentModelValid = true;
                }
            }

            if (!isCurrentModelValid) {
                console.log(`[ModelStateService] No valid ${type.toUpperCase()} model selected. Finding an alternative...`);
                const availableModels = this.getAvailableModels(type);
                if (availableModels.length > 0) {
                    this.state.selectedModels[type] = availableModels[0].id;
                    console.log(`[ModelStateService] Auto-selected ${type.toUpperCase()} model: ${availableModels[0].id}`);
                } else {
                    this.state.selectedModels[type] = null;
                }
            }
        });
    }

    _loadStateForCurrentUser() {
        const userId = this.authService.getCurrentUserId();
        const initialApiKeys = Object.keys(PROVIDERS).reduce((acc, key) => {
            acc[key] = null;
            return acc;
        }, {});

        const defaultState = {
            apiKeys: initialApiKeys,
            selectedModels: { llm: null, stt: null },
        };
        this.state = this.store.get(`users.${userId}`, defaultState);
        console.log(`[ModelStateService] State loaded for user: ${userId}`);
        this._autoSelectAvailableModels();
        this._saveState();
        this._logCurrentSelection();
    }


    _saveState() {
        const userId = this.authService.getCurrentUserId();
        this.store.set(`users.${userId}`, this.state);
        console.log(`[ModelStateService] State saved for user: ${userId}`);
        this._logCurrentSelection();
    }

    async validateApiKey(provider, key) {
        if (!key || key.trim() === '') {
            return { success: false, error: 'API key cannot be empty.' };
        }

        // Create timeout controller for fetch requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log(`[ModelStateService] Validation timeout for ${provider} after 15 seconds`);
            controller.abort();
        }, 15000); // 15 second timeout

        try {
            let validationUrl, headers, body, method = 'GET';

            switch (provider) {
                case 'openai':
                    validationUrl = 'https://api.openai.com/v1/models';
                    headers = { 'Authorization': `Bearer ${key}` };
                    break;
                case 'gemini':
                    validationUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
                    headers = {};
                    break;
                case 'anthropic': {
                    if (!key.startsWith('sk-ant-')) {
                        clearTimeout(timeoutId);
                        return { success: false, error: 'Invalid Anthropic key format. Must start with sk-ant-' };
                    }
                    
                    validationUrl = 'https://api.anthropic.com/v1/messages';
                    method = 'POST';
                    headers = {
                        "Content-Type": "application/json",
                        "x-api-key": key,
                        "anthropic-version": "2023-06-01",
                    };
                    body = JSON.stringify({
                        model: "claude-3-haiku-20240307",
                        max_tokens: 1,
                        messages: [{ role: "user", content: "Hi" }],
                    });
                    break;
                }
                default:
                    clearTimeout(timeoutId);
                    return { success: false, error: 'Unknown provider.' };
            }

            console.log(`[ModelStateService] Validating ${provider} API key...`);
            console.log(`[ModelStateService] Request details: ${method} ${validationUrl}`);
            console.log(`[ModelStateService] Headers:`, headers);
            
            const response = await fetch(validationUrl, { 
                method,
                headers, 
                body,
                signal: controller.signal
            });
            
            console.log(`[ModelStateService] Received response: ${response.status} ${response.statusText}`);

            clearTimeout(timeoutId);

            if (response.ok) {
                console.log(`[ModelStateService] API key for ${provider} is valid.`);
                this.setApiKey(provider, key);
                return { success: true };
            } else if (provider === 'anthropic' && response.status === 400) {
                // For Anthropic, a 400 response with proper error structure indicates valid auth
                console.log(`[ModelStateService] API key for ${provider} is valid (expected 400 response).`);
                this.setApiKey(provider, key);
                return { success: true };
            } else {
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error?.message || errorData.message || `Validation failed with status: ${response.status}`;
                } catch (jsonError) {
                    errorMessage = `Validation failed with status: ${response.status}`;
                }
                console.log(`[ModelStateService] API key for ${provider} is invalid: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                console.error(`[ModelStateService] Validation timeout for ${provider}`);
                return { success: false, error: 'Validation timed out. Please check your network connection and try again.' };
            }
            
            console.error(`[ModelStateService] Network error during ${provider} key validation:`, error);
            return { success: false, error: 'A network error occurred during validation. Please check your connection and try again.' };
        }
    }
    
    setFirebaseVirtualKey(virtualKey) {
        console.log(`[ModelStateService] Setting Firebase virtual key (for openai-glass).`);
        this.state.apiKeys['openai-glass'] = virtualKey;
        
        const llmModels = PROVIDERS['openai-glass']?.llmModels;
        const sttModels = PROVIDERS['openai-glass']?.sttModels;

        if (!this.state.selectedModels.llm && llmModels?.length > 0) {
            this.state.selectedModels.llm = llmModels[0].id;
        }
        if (!this.state.selectedModels.stt && sttModels?.length > 0) {
            this.state.selectedModels.stt = sttModels[0].id;
        }
        this._autoSelectAvailableModels();
        this._saveState();
        this._logCurrentSelection();
    }

    setApiKey(provider, key) {
        if (provider in this.state.apiKeys) {
            this.state.apiKeys[provider] = key;

            const llmModels = PROVIDERS[provider]?.llmModels;
            const sttModels = PROVIDERS[provider]?.sttModels;

            if (!this.state.selectedModels.llm && llmModels?.length > 0) {
                this.state.selectedModels.llm = llmModels[0].id;
            }
            if (!this.state.selectedModels.stt && sttModels?.length > 0) {
                this.state.selectedModels.stt = sttModels[0].id;
            }
            this._saveState();
            this._logCurrentSelection();
            return true;
        }
        return false;
    }

    getApiKey(provider) {
        return this.state.apiKeys[provider] || null;
    }

    getAllApiKeys() {
        const { 'openai-glass': _, ...displayKeys } = this.state.apiKeys;
        return displayKeys;
    }

    removeApiKey(provider) {
        if (provider in this.state.apiKeys) {
            this.state.apiKeys[provider] = null;
            const llmProvider = this.getProviderForModel('llm', this.state.selectedModels.llm);
            if (llmProvider === provider) this.state.selectedModels.llm = null;

            const sttProvider = this.getProviderForModel('stt', this.state.selectedModels.stt);
            if (sttProvider === provider) this.state.selectedModels.stt = null;
            
            this._autoSelectAvailableModels();
            this._saveState();
            this._logCurrentSelection();
            return true;
        }
        return false;
    }

    getProviderForModel(type, modelId) {
        if (!modelId) return null;
        for (const providerId in PROVIDERS) {
            const models = type === 'llm' ? PROVIDERS[providerId].llmModels : PROVIDERS[providerId].sttModels;
            if (models.some(m => m.id === modelId)) {
                return providerId;
            }
        }
        return null;
    }

    getCurrentProvider(type) {
        const selectedModel = this.state.selectedModels[type];
        return this.getProviderForModel(type, selectedModel);
    }

    isLoggedInWithFirebase() {
        return this.authService.getCurrentUser().isLoggedIn;
    }

    areProvidersConfigured() {
        if (this.isLoggedInWithFirebase()) return true;
        
        // LLM과 STT 모델을 제공하는 Provider 중 하나라도 API 키가 설정되었는지 확인
        const hasLlmKey = Object.entries(this.state.apiKeys).some(([provider, key]) => key && PROVIDERS[provider]?.llmModels.length > 0);
        const hasSttKey = Object.entries(this.state.apiKeys).some(([provider, key]) => key && PROVIDERS[provider]?.sttModels.length > 0);
        
        return hasLlmKey && hasSttKey;
    }


    getAvailableModels(type) {
        const available = [];
        const modelList = type === 'llm' ? 'llmModels' : 'sttModels';

        Object.entries(this.state.apiKeys).forEach(([providerId, key]) => {
            if (key && PROVIDERS[providerId]?.[modelList]) {
                available.push(...PROVIDERS[providerId][modelList]);
            }
        });
        return [...new Map(available.map(item => [item.id, item])).values()];
    }
    
    getSelectedModels() {
        return this.state.selectedModels;
    }
    
    setSelectedModel(type, modelId) {
        const provider = this.getProviderForModel(type, modelId);
        if (provider && this.state.apiKeys[provider]) {
            this.state.selectedModels[type] = modelId;
            this._saveState();
            return true;
        }
        return false;
    }

    /**
     * 
     * @param {('llm' | 'stt')} type
     * @returns {{provider: string, model: string, apiKey: string} | null}
     */
    getCurrentModelInfo(type) {
        this._logCurrentSelection();
        const model = this.state.selectedModels[type];
        if (!model) {
            return null; 
        }
        
        const provider = this.getProviderForModel(type, model);
        if (!provider) {
            return null;
        }

        const apiKey = this.getApiKey(provider);
        return { provider, model, apiKey };
    }
    
    setupIpcHandlers() {
        ipcMain.handle('model:validate-key', async (e, { provider, key }) => {
            console.log(`[ModelStateService] IPC: validate-key called for provider: ${provider}, key length: ${key?.length || 0}`);
            try {
                const result = await this.validateApiKey(provider, key);
                console.log(`[ModelStateService] IPC: validate-key result for ${provider}:`, result);
                return result;
            } catch (error) {
                console.error(`[ModelStateService] IPC: validate-key error for ${provider}:`, error);
                return { success: false, error: 'Internal validation error: ' + error.message };
            }
        });
        ipcMain.handle('model:get-all-keys', () => this.getAllApiKeys());
        ipcMain.handle('model:set-api-key', (e, { provider, key }) => this.setApiKey(provider, key));
        ipcMain.handle('model:remove-api-key', (e, { provider }) => {
            const success = this.removeApiKey(provider);
            if (success) {
                const selectedModels = this.getSelectedModels();
                if (!selectedModels.llm || !selectedModels.stt) {
                    webContents.getAllWebContents().forEach(wc => {
                        wc.send('force-show-apikey-header');
                    });
                }
            }
            return success;
        });
        ipcMain.handle('model:get-selected-models', () => this.getSelectedModels());
        ipcMain.handle('model:set-selected-model', (e, { type, modelId }) => this.setSelectedModel(type, modelId));
        ipcMain.handle('model:get-available-models', (e, { type }) => this.getAvailableModels(type));
        ipcMain.handle('model:are-providers-configured', () => this.areProvidersConfigured());
        ipcMain.handle('model:get-current-model-info', (e, { type }) => this.getCurrentModelInfo(type));

        ipcMain.handle('model:get-provider-config', () => {
            const serializableProviders = {};
            for (const key in PROVIDERS) {
                const { handler, ...rest } = PROVIDERS[key];
                serializableProviders[key] = rest;
            }
            return serializableProviders;
        });
    }
}

module.exports = ModelStateService;