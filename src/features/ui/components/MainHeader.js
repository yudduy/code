import { html, css, LitElement } from '../../../assets/vendor/lit-core-2.7.4.min.js';
import { applyDesignTokensToRoot } from '../styles/design-tokens.js';

export class MainHeader extends LitElement {
    static properties = {
        focusedAppId: { type: String },
        appSignatures: { type: Object, state: true },
        isAssessmentMode: { type: Boolean, state: true },
        timerDisplay: { type: String },
        wordCount: { type: Number },
        assessmentActive: { type: Boolean, state: true },
        assessmentState: { type: String },
    };

    static styles = css`
        :host {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 36px; /* Professional status bar height */
            z-index: 1000;
        }

        :host(.hidden) {
            display: none;
        }

        * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            cursor: default;
            user-select: none;
        }

        .header {
            width: 100%;
            height: 36px; /* Professional status bar height */
            padding: 0 16px;
            background: #24282F; /* Component Background - solid */
            border-bottom: 1px solid rgba(255, 255, 255, 0.1); /* Bottom border to separate from content */
            display: flex;
            align-items: center;
            justify-content: flex-start; /* Left-aligned, not centered */
            box-sizing: border-box;
            position: relative;
            -webkit-app-region: drag; /* Make entire header draggable */
        }

        /* Professional Status Bar Elements */
        .status-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            height: 100%;
        }

        .status-logo {
            width: 16px;
            height: 16px;
            fill: #A8A8B3; /* Secondary text - monochrome */
            flex-shrink: 0;
            -webkit-app-region: no-drag;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #F75A68; /* Critical color for recording */
            font-weight: 500;
            -webkit-app-region: no-drag;
        }

        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #F75A68; /* Critical color */
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }

        .status-separator {
            width: 1px;
            height: 16px;
            background: rgba(255, 255, 255, 0.1);
            flex-shrink: 0;
        }

        .focused-app {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #E1E1E6; /* Primary text */
            -webkit-app-region: no-drag;
        }

        .focused-app-icon {
            width: 14px;
            height: 14px;
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            flex-shrink: 0;
        }

        .focused-app-icon img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 2px;
        }

        .assessment-timer {
            font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
            font-size: 13px;
            color: #E1E1E6; /* Normal timer color */
            font-weight: 500;
            -webkit-app-region: no-drag;
            min-width: 45px;
        }

        .assessment-timer.warning {
            color: #F39C12; /* Warning color */
        }

        .assessment-timer.critical {
            color: #F75A68; /* Critical color */
        }

        .stop-button {
            background: transparent;
            color: #F75A68; /* Critical color */
            border: 1px solid #F75A68;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            -webkit-app-region: no-drag;
        }

        .stop-button:hover {
            background: rgba(247, 90, 104, 0.1);
            border-color: #FF6B7A;
            color: #FF6B7A;
        }

        .stop-button:active {
            background: rgba(247, 90, 104, 0.2);
        }

        /* Spacer to push elements to the right */
        .spacer {
            flex: 1;
        }

        /* Clean up complete - legacy styles removed */

        /* Professional Status Bar Design Complete */
    `;

    constructor() {
        super();
        
        // Apply design tokens to root for consistent styling
        applyDesignTokensToRoot();
        
        // Assessment mode properties
        this.focusedAppId = null;
        this.appSignatures = {};
        this.isAssessmentMode = false;
        this.timerDisplay = '90:00';
        this.wordCount = 0;
        this.assessmentActive = false;
        this.assessmentState = null;
        
        // Simplified drag handling for status bar
        this.dragState = null;
        this.wasJustDragged = false;
        
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
    }

    async handleMouseDown(e) {
        e.preventDefault();

        if (!window.electronAPI) {
            console.warn('[MainHeader] ElectronAPI not available for drag operation');
            return;
        }
        const initialPosition = await window.electronAPI.getHeaderPosition();

        this.dragState = {
            initialMouseX: e.screenX,
            initialMouseY: e.screenY,
            initialWindowX: initialPosition.x,
            initialWindowY: initialPosition.y,
            moved: false,
        };

        window.addEventListener('mousemove', this.handleMouseMove, { capture: true });
        window.addEventListener('mouseup', this.handleMouseUp, { once: true, capture: true });
    }

    handleMouseMove(e) {
        if (!this.dragState) return;

        const deltaX = Math.abs(e.screenX - this.dragState.initialMouseX);
        const deltaY = Math.abs(e.screenY - this.dragState.initialMouseY);
        
        if (deltaX > 3 || deltaY > 3) {
            this.dragState.moved = true;
        }

        const newWindowX = this.dragState.initialWindowX + (e.screenX - this.dragState.initialMouseX);
        const newWindowY = this.dragState.initialWindowY + (e.screenY - this.dragState.initialMouseY);

        if (window.electronAPI) {
            window.electronAPI.moveHeaderTo(newWindowX, newWindowY);
        }
    }

    handleMouseUp(e) {
        if (!this.dragState) return;

        const wasDragged = this.dragState.moved;

        window.removeEventListener('mousemove', this.handleMouseMove, { capture: true });
        this.dragState = null;

        if (wasDragged) {
            this.wasJustDragged = true;
            setTimeout(() => {
                this.wasJustDragged = false;
            }, 0);
        }
    }

    toggleVisibility() {
        if (this.isAnimating) {
            console.log('[MainHeader] Animation already in progress, ignoring toggle');
            return;
        }
        
        if (this.animationEndTimer) {
            clearTimeout(this.animationEndTimer);
            this.animationEndTimer = null;
        }
        
        this.isAnimating = true;
        
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    hide() {
        this.classList.remove('showing', 'hidden');
        this.classList.add('hiding');
        this.isVisible = false;
        
        this.animationEndTimer = setTimeout(() => {
            if (this.classList.contains('hiding')) {
                this.handleAnimationEnd({ target: this });
            }
        }, 350);
    }

    show() {
        this.classList.remove('hiding', 'hidden');
        this.classList.add('showing');
        this.isVisible = true;
        
        this.animationEndTimer = setTimeout(() => {
            if (this.classList.contains('showing')) {
                this.handleAnimationEnd({ target: this });
            }
        }, 400);
    }

    handleAnimationEnd(e) {
        if (e.target !== this) return;
        
        if (this.animationEndTimer) {
            clearTimeout(this.animationEndTimer);
            this.animationEndTimer = null;
        }
        
        this.isAnimating = false;
        
        if (this.classList.contains('hiding')) {
            this.classList.remove('hiding');
            this.classList.add('hidden');
            
            // Animation complete events are handled by backend
        } else if (this.classList.contains('showing')) {
            this.classList.remove('showing');
            
            // Animation complete events are handled by backend
        } else if (this.classList.contains('sliding-in')) {
            this.classList.remove('sliding-in');
            this.hasSlidIn = true;
            console.log('[MainHeader] Slide-in animation completed');
        }
    }

    startSlideInAnimation() {
        if (this.hasSlidIn) return;
        this.classList.add('sliding-in');
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('animationend', this.handleAnimationEnd);

        // Load app signatures from the centralized configuration
        this.loadAppSignatures();

        // Set up focus change listener using the new electronAPI (telemetry feature)
        // This is completely optional and doesn't interfere with existing functionality
        try {
            if (window.electronAPI && window.electronAPI.onFocusChange) {
                window.electronAPI.onFocusChange((event, focusEvent) => {
                    if (focusEvent && focusEvent.appId) {
                        this.focusedAppId = focusEvent.appId;
                        this.requestUpdate();
                    }
                });
            }
        } catch (error) {
            // Silently ignore any issues with focus tracking - it's optional
            console.debug('[MainHeader] Focus tracking unavailable:', error.message);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('animationend', this.handleAnimationEnd);
        
        if (this.animationEndTimer) {
            clearTimeout(this.animationEndTimer);
            this.animationEndTimer = null;
        }
        
        // Remove focus change listener (telemetry feature)
        try {
            if (window.electronAPI && window.electronAPI.removeFocusChangeListener) {
                window.electronAPI.removeFocusChangeListener();
            }
        } catch (error) {
            // Silently ignore any cleanup issues
            console.debug('[MainHeader] Focus tracking cleanup:', error.message);
        }
        
        // No additional cleanup needed for appSignatures
    }

    async loadAppSignatures() {
        if (window.electronAPI) {
            try {
                this.appSignatures = await window.electronAPI.getAppSignatures();
                console.log('[MainHeader] App signatures loaded:', Object.keys(this.appSignatures).length, 'applications');
            } catch (error) {
                console.warn('[MainHeader] Failed to load app signatures:', error.message);
                this.appSignatures = {};
            }
        }
    }

    invoke(channel, ...args) {
        if (this.wasJustDragged) {
            return;
        }
        if (window.electronAPI) {
            // Map the channel to the appropriate electronAPI method
            switch (channel) {
                case 'toggle-feature':
                    return window.electronAPI.toggleFeature(args[0]);
                case 'toggle-all-windows-visibility':
                    return window.electronAPI.toggleAllWindowsVisibility();
                default:
                    console.warn('[MainHeader] Unknown channel:', channel);
            }
        }
    }

    showWindow(name, element) {
        if (this.wasJustDragged) return;
        if (window.electronAPI) {
            console.log(`[MainHeader] showWindow('${name}') called at ${Date.now()}`);
            
            window.electronAPI.cancelHideWindow(name);

            if (name === 'settings' && element) {
                const rect = element.getBoundingClientRect();
                window.electronAPI.showWindow({
                    name: 'settings',
                    bounds: {
                        x: rect.left,
                        y: rect.top,
                        width: rect.width,
                        height: rect.height
                    }
                });
            } else {
                window.electronAPI.showWindow(name);
            }
        }
    }

    hideWindow(name) {
        if (this.wasJustDragged) return;
        if (window.electronAPI) {
            console.log(`[MainHeader] hideWindow('${name}') called at ${Date.now()}`);
            window.electronAPI.hideWindow(name);
        }
    }

    cancelHideWindow(name) {

    }

    getAppDisplayInfo(appId) {
        if (!appId || typeof appId !== 'string') return null;
        
        try {
            // Look up the appId in the centralized appSignatures
            const appInfo = this.appSignatures[appId];
            if (appInfo && appInfo.displayName && appInfo.icon) {
                return { 
                    name: appInfo.displayName, 
                    icon: appInfo.icon,
                    isImage: appInfo.icon.includes('.png') || appInfo.icon.includes('.jpg') || appInfo.icon.includes('.svg')
                };
            }
            
            // Return sensible default if not found
            return { name: appId, icon: '📱', isImage: false };
        } catch (error) {
            console.debug('[MainHeader] Error in getAppDisplayInfo:', error.message);
            return { name: 'Unknown', icon: '📱', isImage: false };
        }
    }

    /**
     * Enable assessment mode with timer and word counter
     * @param {string} initialTimer - Initial timer display (e.g., "90:00")
     */
    enableAssessmentMode(initialTimer = '90:00') {
        this.isAssessmentMode = true;
        this.assessmentActive = true;
        this.timerDisplay = initialTimer;
        this.wordCount = 0;
        console.log('[MainHeader] Assessment mode enabled');
    }

    /**
     * Disable assessment mode
     */
    disableAssessmentMode() {
        this.isAssessmentMode = false;
        this.assessmentActive = false;
        this.timerDisplay = '90:00';
        this.wordCount = 0;
        console.log('[MainHeader] Assessment mode disabled');
    }

    /**
     * Update the timer display
     * @param {string} timerText - Timer text to display
     */
    updateTimer(timerText) {
        this.timerDisplay = timerText;
    }

    /**
     * Update the word counter
     * @param {number} count - Current word count
     */
    updateWordCount(count) {
        this.wordCount = count;
    }

    /**
     * Handle stop button click
     */
    handleStopAssessment() {
        this.dispatchEvent(new CustomEvent('stop-assessment', {
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Get timer class based on remaining time
     * @returns {string} CSS class for timer styling
     */
    getTimerClass() {
        const parts = this.timerDisplay.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0], 10);
            const seconds = parseInt(parts[1], 10);
            const totalSeconds = minutes * 60 + seconds;
            
            if (totalSeconds <= 5 * 60) { // Last 5 minutes
                return 'critical';
            } else if (totalSeconds <= 15 * 60) { // Last 15 minutes
                return 'warning';
            }
        }
        return '';
    }

    render() {
        // Only show header during assessment
        if (this.assessmentState !== 'ASSESSMENT_IN_PROGRESS') {
            return html``;
        }
        
        // Professional Status Bar Layout: [Logo] [● Recording] [|] [App] [Timer] [Stop]
        return html`
            <div class="header">
                <div class="status-bar">
                    <!-- Monochrome Codexel Logo -->
                    <svg class="status-logo" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    
                    <!-- Recording Status -->
                    <div class="status-indicator">
                        <div class="status-dot"></div>
                        <span>Recording</span>
                    </div>
                    
                    <!-- Separator -->
                    <div class="status-separator"></div>
                    
                    <!-- Active App -->
                    <div class="focused-app">
                        ${(() => {
                            if (this.focusedAppId) {
                                const appInfo = this.getAppDisplayInfo(this.focusedAppId);
                                return html`
                                    <div class="focused-app-icon">
                                        ${appInfo.isImage 
                                            ? html`<img src="${appInfo.icon}" alt="${appInfo.name}" />` 
                                            : appInfo.icon
                                        }
                                    </div>
                                    <span>${appInfo.name}</span>
                                `;
                            }
                            return html`<span>No app focused</span>`;
                        })()}
                    </div>
                    
                    <!-- Spacer to push timer and stop to the right -->
                    <div class="spacer"></div>
                    
                    <!-- Timer -->
                    <div class="assessment-timer ${this.getTimerClass()}">
                        ${this.timerDisplay}
                    </div>
                    
                    <!-- Stop Button -->
                    <button class="stop-button" @click=${this.handleStopAssessment}>
                        Stop
                    </button>
                </div>
            </div>
        `;
    }
}

customElements.define('main-header', MainHeader);
