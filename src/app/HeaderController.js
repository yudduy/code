import './MainHeader.js';
import './ApiKeyHeader.js';
import './PermissionHeader.js';

class HeaderTransitionManager {
    constructor() {
        this.headerContainer      = document.getElementById('header-container');
        this.currentHeaderType    = null;   // 'apikey' | 'main' | 'permission'
        this.apiKeyHeader         = null;
        this.mainHeader            = null;
        this.permissionHeader      = null;

        /**
         * only one header window is allowed
         * @param {'apikey'|'main'|'permission'} type
         */
        this.ensureHeader = (type) => {
            console.log('[HeaderController] ensureHeader: Ensuring header of type:', type);
            if (this.currentHeaderType === type) {
                console.log('[HeaderController] ensureHeader: Header of type:', type, 'already exists.');
                return;
            }

            this.headerContainer.innerHTML = '';
            
            this.apiKeyHeader = null;
            this.mainHeader = null;
            this.permissionHeader = null;

            // Create new header element
            if (type === 'apikey') {
                this.apiKeyHeader = document.createElement('apikey-header');
                this.apiKeyHeader.stateUpdateCallback = (userState) => this.handleStateUpdate(userState);
                this.headerContainer.appendChild(this.apiKeyHeader);
            } else if (type === 'permission') {
                this.permissionHeader = document.createElement('permission-setup');
                this.permissionHeader.continueCallback = () => this.transitionToMainHeader();
                this.headerContainer.appendChild(this.permissionHeader);
            } else {
                this.mainHeader = document.createElement('main-header');
                this.headerContainer.appendChild(this.mainHeader);
                this.mainHeader.startSlideInAnimation?.();
            }

            this.currentHeaderType = type;
            this.notifyHeaderState(type === 'permission' ? 'apikey' : type); // Keep permission state as apikey for compatibility
        };

        console.log('[HeaderController] Manager initialized');

        this._bootstrap();

        if (window.electronAPI) {
            window.electronAPI.onUserStateChanged((event, userState) => {
                console.log('[HeaderController] Received user state change:', userState);
                this.handleStateUpdate(userState);
            });

            window.electronAPI.onAuthFailedEvent((event, { message }) => {
                console.error('[HeaderController] Received auth failure from main process:', message);
                if (this.apiKeyHeader) {
                    this.apiKeyHeader.errorMessage = 'Authentication failed. Please try again.';
                    this.apiKeyHeader.isLoading = false;
                }
            });
            
            window.electronAPI.onForceShowApiKeyHeader(async () => {
                console.log('[HeaderController] Received broadcast to show apikey header. Switching now.');
                await this._resizeForApiKey();
                this.ensureHeader('apikey');
            });
        }
    }

    notifyHeaderState(stateOverride) {
        const state = stateOverride || this.currentHeaderType || 'apikey';
        if (window.electronAPI) {
            window.electronAPI.sendHeaderStateChanged(state);
        }
    }

    async _bootstrap() {
        // The initial state will be sent by the main process via 'user-state-changed'
        // We just need to request it.
        if (window.electronAPI) {
            const userState = await window.electronAPI.getCurrentUser();
            console.log('[HeaderController] Bootstrapping with initial user state:', userState);
            this.handleStateUpdate(userState);
        } else {
            // Fallback for non-electron environment (testing/web)
            this.ensureHeader('apikey');
        }
    }


    //////// after_modelStateService ////////
    async handleStateUpdate(userState) {
        if (!window.electronAPI) {
            console.error('[HeaderController] ElectronAPI not available');
            return;
        }
        
        const isConfigured = await window.electronAPI.areProvidersConfigured();

        if (isConfigured) {
            const { isLoggedIn } = userState;
            if (isLoggedIn) {
                const permissionResult = await this.checkPermissions();
                if (permissionResult.success) {
                    this.transitionToMainHeader();
                } else {
                    this.transitionToPermissionHeader();
                }
            } else {
                this.transitionToMainHeader();
            }
        } else {
            await this._resizeForApiKey();
            this.ensureHeader('apikey');
        }
    }
    //////// after_modelStateService ////////

    async transitionToPermissionHeader() {
        // Prevent duplicate transitions
        if (this.currentHeaderType === 'permission') {
            console.log('[HeaderController] Already showing permission setup, skipping transition');
            return;
        }

        // Check if permissions were previously completed
        if (window.electronAPI) {
            try {
                const permissionsCompleted = await window.electronAPI.checkPermissionsCompleted();
                if (permissionsCompleted) {
                    console.log('[HeaderController] Permissions were previously completed, checking current status...');
                    
                    // Double check current permission status
                    const permissionResult = await this.checkPermissions();
                    if (permissionResult.success) {
                        // Skip permission setup if already granted
                        this.transitionToMainHeader();
                        return;
                    }
                    
                    console.log('[HeaderController] Permissions were revoked, showing setup again');
                }
            } catch (error) {
                console.error('[HeaderController] Error checking permissions completed status:', error);
            }
        }

        await this._resizeForPermissionHeader();
        this.ensureHeader('permission');
    }

    async transitionToMainHeader(animate = true) {
        if (this.currentHeaderType === 'main') {
            return this._resizeForMain();
        }

        await this._resizeForMain();
        this.ensureHeader('main');
    }

    _resizeForMain() {
        if (!window.electronAPI) return;
        return window.electronAPI.resizeHeaderWindow(353, 47).catch(() => {});
    }

    async _resizeForApiKey() {
        if (!window.electronAPI) return;
        return window.electronAPI.resizeHeaderWindow(390, 320).catch(() => {});
    }

    async _resizeForPermissionHeader() {
        if (!window.electronAPI) return;
        return window.electronAPI.resizeHeaderWindow(285, 220).catch(() => {});
    }

    async checkPermissions() {
        if (!window.electronAPI) {
            return { success: true };
        }

        try {
            const permissions = await window.electronAPI.checkPermissions();
            console.log('[HeaderController] Current permissions:', permissions);
            
            if (!permissions.needsSetup) {
                return { success: true };
            }

            let errorMessage = '';
            if (!permissions.microphone && !permissions.screen) {
                errorMessage = 'Microphone and screen recording access required';
            }
            
            return { 
                success: false, 
                error: errorMessage
            };
        } catch (error) {
            console.error('[HeaderController] Error checking permissions:', error);
            return { 
                success: false, 
                error: 'Failed to check permissions' 
            };
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new HeaderTransitionManager();
});
