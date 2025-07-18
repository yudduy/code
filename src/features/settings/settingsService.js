const { ipcMain, BrowserWindow } = require('electron');
const Store = require('electron-store');
const authService = require('../../common/services/authService');
const userRepository = require('../../common/repositories/user');
const settingsRepository = require('./repositories');
const { getStoredApiKey, getStoredProvider } = require('../../electron/windowManager');

const store = new Store({
    name: 'pickle-glass-settings',
    defaults: {
        users: {}
    }
});

// Configuration constants
const NOTIFICATION_CONFIG = {
    RELEVANT_WINDOW_TYPES: ['settings', 'main'],
    DEBOUNCE_DELAY: 300, // prevent spam during bulk operations (ms)
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_BASE_DELAY: 1000, // exponential backoff base (ms)
};

// window targeting system
class WindowNotificationManager {
    constructor() {
        this.pendingNotifications = new Map();
    }

    /**
     * Send notifications only to relevant windows
     * @param {string} event - Event name
     * @param {*} data - Event data
     * @param {object} options - Notification options
     */
    notifyRelevantWindows(event, data = null, options = {}) {
        const { 
            windowTypes = NOTIFICATION_CONFIG.RELEVANT_WINDOW_TYPES,
            debounce = NOTIFICATION_CONFIG.DEBOUNCE_DELAY 
        } = options;

        if (debounce > 0) {
            this.debounceNotification(event, () => {
                this.sendToTargetWindows(event, data, windowTypes);
            }, debounce);
        } else {
            this.sendToTargetWindows(event, data, windowTypes);
        }
    }

    sendToTargetWindows(event, data, windowTypes) {
        const relevantWindows = this.getRelevantWindows(windowTypes);
        
        if (relevantWindows.length === 0) {
            console.log(`[WindowNotificationManager] No relevant windows found for event: ${event}`);
            return;
        }

        console.log(`[WindowNotificationManager] Sending ${event} to ${relevantWindows.length} relevant windows`);
        
        relevantWindows.forEach(win => {
            try {
                if (data) {
                    win.webContents.send(event, data);
                } else {
                    win.webContents.send(event);
                }
            } catch (error) {
                console.warn(`[WindowNotificationManager] Failed to send ${event} to window:`, error.message);
            }
        });
    }

    getRelevantWindows(windowTypes) {
        const allWindows = BrowserWindow.getAllWindows();
        const relevantWindows = [];

        // Try to use AssessmentWindowManager if available
        const assessmentWindowManager = global.assessmentWindowManager;
        if (assessmentWindowManager) {
            // Check each window type in the assessment manager
            for (const windowType of windowTypes) {
                const window = assessmentWindowManager.getWindow(windowType);
                if (window && !window.isDestroyed() && (windowType === 'settings' || window.isVisible())) {
                    relevantWindows.push(window);
                }
            }
        }

        // Fallback: if no assessment manager or no relevant windows found, use all visible windows
        if (relevantWindows.length === 0) {
            allWindows.forEach(win => {
                if (!win.isDestroyed() && win.isVisible()) {
                    relevantWindows.push(win);
                }
            });
        }

        return relevantWindows;
    }

    debounceNotification(key, fn, delay) {
        // Clear existing timeout
        if (this.pendingNotifications.has(key)) {
            clearTimeout(this.pendingNotifications.get(key));
        }

        // Set new timeout
        const timeoutId = setTimeout(() => {
            fn();
            this.pendingNotifications.delete(key);
        }, delay);

        this.pendingNotifications.set(key, timeoutId);
    }

    cleanup() {
        // Clear all pending notifications
        this.pendingNotifications.forEach(timeoutId => clearTimeout(timeoutId));
        this.pendingNotifications.clear();
    }
}

// Global instance
const windowNotificationManager = new WindowNotificationManager();

// Default keybinds configuration
const DEFAULT_KEYBINDS = {
    mac: {
        moveUp: 'Cmd+Up',
        moveDown: 'Cmd+Down',
        moveLeft: 'Cmd+Left',
        moveRight: 'Cmd+Right',
        toggleVisibility: 'Cmd+\\',
        toggleClickThrough: 'Cmd+M',
        nextStep: 'Cmd+Enter',
        manualScreenshot: 'Cmd+Shift+S',
        previousResponse: 'Cmd+[',
        nextResponse: 'Cmd+]',
        scrollUp: 'Cmd+Shift+Up',
        scrollDown: 'Cmd+Shift+Down',
    },
    windows: {
        moveUp: 'Ctrl+Up',
        moveDown: 'Ctrl+Down',
        moveLeft: 'Ctrl+Left',
        moveRight: 'Ctrl+Right',
        toggleVisibility: 'Ctrl+\\',
        toggleClickThrough: 'Ctrl+M',
        nextStep: 'Ctrl+Enter',
        manualScreenshot: 'Ctrl+Shift+S',
        previousResponse: 'Ctrl+[',
        nextResponse: 'Ctrl+]',
        scrollUp: 'Ctrl+Shift+Up',
        scrollDown: 'Ctrl+Shift+Down',
    }
};

// Service state
let currentSettings = null;

function getDefaultSettings() {
    const isMac = process.platform === 'darwin';
    return {
        profile: 'school',
        language: 'en',
        screenshotInterval: '5000',
        imageQuality: '0.8',
        layoutMode: 'stacked',
        keybinds: isMac ? DEFAULT_KEYBINDS.mac : DEFAULT_KEYBINDS.windows,
        throttleTokens: 500,
        maxTokens: 2000,
        throttlePercent: 80,
        googleSearchEnabled: false,
        backgroundTransparency: 0.5,
        fontSize: 14,
        contentProtection: true
    };
}

async function getSettings() {
    try {
        const uid = authService.getCurrentUserId();
        const userSettingsKey = uid ? `users.${uid}` : 'users.default';
        
        const defaultSettings = getDefaultSettings();
        const savedSettings = store.get(userSettingsKey, {});
        
        currentSettings = { ...defaultSettings, ...savedSettings };
        return currentSettings;
    } catch (error) {
        console.error('[SettingsService] Error getting settings from store:', error);
        return getDefaultSettings();
    }
}

async function saveSettings(settings) {
    try {
        const uid = authService.getCurrentUserId();
        const userSettingsKey = uid ? `users.${uid}` : 'users.default';
        
        const currentSaved = store.get(userSettingsKey, {});
        const newSettings = { ...currentSaved, ...settings };
        
        store.set(userSettingsKey, newSettings);
        currentSettings = newSettings;
        
        // Use smart notification system
        windowNotificationManager.notifyRelevantWindows('settings-updated', currentSettings);

        return { success: true };
    } catch (error) {
        console.error('[SettingsService] Error saving settings to store:', error);
        return { success: false, error: error.message };
    }
}

async function getPresets() {
    try {
        const uid = authService.getCurrentUserId();
        if (!uid) {
            // Logged out users only see default presets
            return await settingsRepository.getPresetTemplates();
        }
        
        const presets = await settingsRepository.getPresets(uid);
        return presets;
    } catch (error) {
        console.error('[SettingsService] Error getting presets:', error);
        return [];
    }
}

async function getPresetTemplates() {
    try {
        const templates = await settingsRepository.getPresetTemplates();
        return templates;
    } catch (error) {
        console.error('[SettingsService] Error getting preset templates:', error);
        return [];
    }
}

async function createPreset(title, prompt) {
    try {
        const uid = authService.getCurrentUserId();
        if (!uid) {
            throw new Error("User not logged in, cannot create preset.");
        }
        
        const result = await settingsRepository.createPreset({ uid, title, prompt });
        
        windowNotificationManager.notifyRelevantWindows('presets-updated', {
            action: 'created',
            presetId: result.id,
            title
        });
        
        return { success: true, id: result.id };
    } catch (error) {
        console.error('[SettingsService] Error creating preset:', error);
        return { success: false, error: error.message };
    }
}

async function updatePreset(id, title, prompt) {
    try {
        const uid = authService.getCurrentUserId();
        if (!uid) {
            throw new Error("User not logged in, cannot update preset.");
        }
        
        await settingsRepository.updatePreset(id, { title, prompt }, uid);
        
        windowNotificationManager.notifyRelevantWindows('presets-updated', {
            action: 'updated',
            presetId: id,
            title
        });
        
        return { success: true };
    } catch (error) {
        console.error('[SettingsService] Error updating preset:', error);
        return { success: false, error: error.message };
    }
}

async function deletePreset(id) {
    try {
        const uid = authService.getCurrentUserId();
        if (!uid) {
            throw new Error("User not logged in, cannot delete preset.");
        }
        
        await settingsRepository.deletePreset(id, uid);
        
        windowNotificationManager.notifyRelevantWindows('presets-updated', {
            action: 'deleted',
            presetId: id
        });
        
        return { success: true };
    } catch (error) {
        console.error('[SettingsService] Error deleting preset:', error);
        return { success: false, error: error.message };
    }
}

async function saveApiKey(apiKey, provider = 'openai') {
    try {
        const uid = authService.getCurrentUserId();
        if (!uid) {
            // For non-logged-in users, save to local storage
            const { app } = require('electron');
            const Store = require('electron-store');
            const store = new Store();
            store.set('apiKey', apiKey);
            store.set('provider', provider);
            
            // Notify windows
            BrowserWindow.getAllWindows().forEach(win => {
                if (!win.isDestroyed()) {
                    win.webContents.send('api-key-validated', apiKey);
                }
            });
            
            return { success: true };
        }
        
        // For logged-in users, save to database
        await userRepository.saveApiKey(apiKey, uid, provider);
        
        // Notify windows
        BrowserWindow.getAllWindows().forEach(win => {
            if (!win.isDestroyed()) {
                win.webContents.send('api-key-validated', apiKey);
            }
        });
        
        return { success: true };
    } catch (error) {
        console.error('[SettingsService] Error saving API key:', error);
        return { success: false, error: error.message };
    }
}

async function removeApiKey() {
    try {
        const uid = authService.getCurrentUserId();
        if (!uid) {
            // For non-logged-in users, remove from local storage
            const { app } = require('electron');
            const Store = require('electron-store');
            const store = new Store();
            store.delete('apiKey');
            store.delete('provider');
        } else {
            // For logged-in users, remove from database
            await userRepository.saveApiKey(null, uid, null);
        }
        
        // Notify windows
        BrowserWindow.getAllWindows().forEach(win => {
            if (!win.isDestroyed()) {
                win.webContents.send('api-key-removed');
            }
        });
        
        return { success: true };
    } catch (error) {
        console.error('[SettingsService] Error removing API key:', error);
        return { success: false, error: error.message };
    }
}

async function updateContentProtection(enabled) {
    try {
        const settings = await getSettings();
        settings.contentProtection = enabled;
        
        // Update content protection in assessment windows
        const { app } = require('electron');
        const assessmentWindowManager = global.assessmentWindowManager;
        if (assessmentWindowManager) {
            const headerWindow = assessmentWindowManager.getWindow('header');
            if (headerWindow && !headerWindow.isDestroyed()) {
                headerWindow.setContentProtection(enabled);
            }
        }
        
        return await saveSettings(settings);
    } catch (error) {
        console.error('[SettingsService] Error updating content protection:', error);
        return { success: false, error: error.message };
    }
}

function initialize() {
    // cleanup 
    windowNotificationManager.cleanup();
    
    // IPC handlers for settings
    ipcMain.handle('settings:getSettings', async () => {
        return await getSettings();
    });
    
    ipcMain.handle('settings:saveSettings', async (event, settings) => {
        return await saveSettings(settings);
    });
    
    // IPC handlers for presets
    ipcMain.handle('settings:getPresets', async () => {
        return await getPresets();
    });
    
    ipcMain.handle('settings:getPresetTemplates', async () => {
        return await getPresetTemplates();
    });
    
    ipcMain.handle('settings:createPreset', async (event, title, prompt) => {
        return await createPreset(title, prompt);
    });
    
    ipcMain.handle('settings:updatePreset', async (event, id, title, prompt) => {
        return await updatePreset(id, title, prompt);
    });
    
    ipcMain.handle('settings:deletePreset', async (event, id) => {
        return await deletePreset(id);
    });
    
    ipcMain.handle('settings:saveApiKey', async (event, apiKey, provider) => {
        return await saveApiKey(apiKey, provider);
    });
    
    ipcMain.handle('settings:removeApiKey', async () => {
        return await removeApiKey();
    });
    
    ipcMain.handle('settings:updateContentProtection', async (event, enabled) => {
        return await updateContentProtection(enabled);
    });
    
    console.log('[SettingsService] Initialized and ready.');
}

// Cleanup function
function cleanup() {
    windowNotificationManager.cleanup();
    console.log('[SettingsService] Cleaned up resources.');
}

function notifyPresetUpdate(action, presetId, title = null) {
    const data = { action, presetId };
    if (title) data.title = title;
    
    windowNotificationManager.notifyRelevantWindows('presets-updated', data);
}

module.exports = {
    initialize,
    cleanup,
    notifyPresetUpdate,
    getSettings,
    saveSettings,
    getPresets,
    getPresetTemplates,
    createPreset,
    updatePreset,
    deletePreset,
    saveApiKey,
    removeApiKey,
    updateContentProtection,
};