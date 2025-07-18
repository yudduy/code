import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';

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
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.2s ease-out;
            will-change: transform, opacity;
        }

        :host(.hiding) {
            animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }

        :host(.showing) {
            animation: slideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        :host(.sliding-in) {
            animation: fadeIn 0.2s ease-out forwards;
        }

        :host(.hidden) {
            opacity: 0;
            transform: translateY(-150%) scale(0.85);
            pointer-events: none;
        }

        @keyframes slideUp {
            0% {
                opacity: 1;
                transform: translateY(0) scale(1);
                filter: blur(0px);
            }
            30% {
                opacity: 0.7;
                transform: translateY(-20%) scale(0.98);
                filter: blur(0.5px);
            }
            70% {
                opacity: 0.3;
                transform: translateY(-80%) scale(0.92);
                filter: blur(1.5px);
            }
            100% {
                opacity: 0;
                transform: translateY(-150%) scale(0.85);
                filter: blur(2px);
            }
        }

        @keyframes slideDown {
            0% {
                opacity: 0;
                transform: translateY(-150%) scale(0.85);
                filter: blur(2px);
            }
            30% {
                opacity: 0.5;
                transform: translateY(-50%) scale(0.92);
                filter: blur(1px);
            }
            65% {
                opacity: 0.9;
                transform: translateY(-5%) scale(0.99);
                filter: blur(0.2px);
            }
            85% {
                opacity: 0.98;
                transform: translateY(2%) scale(1.005);
                filter: blur(0px);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
                filter: blur(0px);
            }
        }

        @keyframes fadeIn {
            0% {
                opacity: 0;
            }
            100% {
                opacity: 1;
            }
        }

        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
        }

        .header {
            width: calc(100% - 16px);
            height: 52px;
            margin: 8px;
            padding: 8px 16px;
            background: transparent;
            overflow: hidden;
            border-radius: 9000px;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            justify-content: space-between;
            align-items: center;
            display: inline-flex;
            box-sizing: border-box;
            position: relative;
        }

        .header::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            border-radius: 9000px;
            z-index: -1;
        }

        .header::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            border-radius: 9000px;
            padding: 1px;
            background: linear-gradient(169deg, rgba(255, 255, 255, 0.17) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.17) 100%); 
            -webkit-mask:
                linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
            -webkit-mask-composite: destination-out;
            mask-composite: exclude;
            pointer-events: none;
        }

        .listen-button {
            height: 32px;
            padding: 0 16px;
            background: transparent;
            border-radius: 9000px;
            justify-content: center;
            width: 92px;
            align-items: center;
            gap: 8px;
            display: flex;
            border: none;
            cursor: pointer;
            position: relative;
        }

        .listen-button.active::before {
            background: rgba(215, 0, 0, 0.5);
        }

        .listen-button.active:hover::before {
            background: rgba(255, 20, 20, 0.6);
        }

        .listen-button:hover::before {
            background: rgba(255, 255, 255, 0.18);
        }

        .listen-button::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 9000px;
            z-index: -1;
            transition: background 0.15s ease;
        }

        .listen-button::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            border-radius: 9000px;
            padding: 1px;
            background: linear-gradient(169deg, rgba(255, 255, 255, 0.17) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.17) 100%);
            -webkit-mask:
                linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
            -webkit-mask-composite: destination-out;
            mask-composite: exclude;
            pointer-events: none;
        }

        .header-actions {
            height: 32px;
            box-sizing: border-box;
            justify-content: flex-start;
            align-items: center;
            gap: 10px;
            display: flex;
            padding: 0 10px;
            border-radius: 8px;
            transition: background 0.15s ease;
        }

        .header-actions:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .ask-action {
            margin-left: 4px;
        }

        .action-button,
        .settings-button {
            background: transparent;
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .action-text {
            padding-bottom: 1px;
            justify-content: center;
            align-items: center;
            gap: 10px;
            display: flex;
        }

        .action-text-content {
            color: white;
            font-size: 11px;
            font-family: 'Helvetica Neue', sans-serif;
            font-weight: 500; /* Medium */
            word-wrap: break-word;
        }

        .icon-container {
            justify-content: flex-start;
            align-items: center;
            gap: 4px;
            display: flex;
        }

        .icon-container.ask-icons svg,
        .icon-container.showhide-icons svg {
            width: 12px;
            height: 12px;
        }

        .listen-icon svg {
            width: 12px;
            height: 11px;
            position: relative;
            top: 1px;
        }

        .icon-box {
            color: white;
            font-size: 12px;
            font-family: 'Helvetica Neue', sans-serif;
            font-weight: 500;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 13%;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .settings-button {
            padding: 5px;
            border-radius: 50%;
            transition: background 0.15s ease;
        }
        
        .settings-button:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .settings-icon {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .settings-icon svg {
            width: 16px;
            height: 16px;
        }

        .focused-app-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.1);
            transition: background 0.15s ease;
        }

        .focused-app-indicator:hover {
            background: rgba(255, 255, 255, 0.15);
        }

        .focused-app-icon {
            width: 16px;
            height: 16px;
            border-radius: 3px;
            background: rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 600;
            color: white;
            overflow: hidden;
        }

        .focused-app-icon img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 2px;
        }

        .focused-app-name {
            color: rgba(255, 255, 255, 0.9);
            font-size: 11px;
            font-weight: 500;
            text-transform: capitalize;
        }

        /* Assessment mode styles */
        .assessment-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 0 4px;
            gap: 8px;
        }

        .assessment-timer {
            color: rgba(255, 255, 255, 0.9);
            font-size: 10px;
            font-weight: 600;
            font-family: 'Monaco', 'Menlo', monospace;
            background: transparent;
            padding: 4px 8px;
            border-radius: 3px;
            min-width: 50px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .assessment-timer.warning {
            color: #ff9500;
            border-color: rgba(255, 149, 0, 0.3);
            background: rgba(255, 149, 0, 0.1);
        }

        .assessment-timer.critical {
            color: #ff3b30;
            border-color: rgba(255, 59, 48, 0.3);
            background: rgba(255, 59, 48, 0.1);
        }

        .stop-button {
            background: transparent;
            color: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s cubic-bezier(0.23, 1, 0.32, 1);
            min-width: 24px;
            height: 24px;
        }

        .stop-button:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .stop-button:active {
            background: rgba(255, 255, 255, 0.15);
        }

        .word-counter {
            color: rgba(255, 255, 255, 0.9);
            font-size: 11px;
            font-weight: 500;
            background: transparent;
            padding: 4px 8px;
            border-radius: 3px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            min-width: 40px;
            text-align: center;
        }

        .word-counter.active {
            color: #007aff;
            border-color: rgba(0, 122, 255, 0.3);
            background: rgba(0, 122, 255, 0.1);
        }

        .focused-app-simple {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 2px 6px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            min-width: 24px;
            justify-content: center;
        }

        .focused-app-simple .focused-app-icon {
            width: 12px;
            height: 12px;
            font-size: 8px;
        }

        .focused-app-simple .focused-app-name {
            display: none;
        }

        .settings-button-simple {
            background: transparent;
            color: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            padding: 0;
            cursor: pointer;
            transition: all 0.15s cubic-bezier(0.23, 1, 0.32, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            position: relative;
        }

        .settings-button-simple:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .settings-button-simple svg {
            width: 12px;
            height: 12px;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }

        /* ────────────────[ GLASS BYPASS ]─────────────── */
        :host-context(body.has-glass) .header,
        :host-context(body.has-glass) .listen-button,
        :host-context(body.has-glass) .header-actions,
        :host-context(body.has-glass) .settings-button {
            background: transparent !important;
            filter: none !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
        }
        :host-context(body.has-glass) .icon-box {
            background: transparent !important;
            border: none !important;
        }

        :host-context(body.has-glass) .header::before,
        :host-context(body.has-glass) .header::after,
        :host-context(body.has-glass) .listen-button::before,
        :host-context(body.has-glass) .listen-button::after {
            display: none !important;
        }

        :host-context(body.has-glass) .header-actions:hover,
        :host-context(body.has-glass) .settings-button:hover,
        :host-context(body.has-glass) .listen-button:hover::before {
            background: transparent !important;
        }
        :host-context(body.has-glass) * {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            filter: none !important;
            backdrop-filter: none !important;
            box-shadow: none !important;
        }

        :host-context(body.has-glass) .header,
        :host-context(body.has-glass) .listen-button,
        :host-context(body.has-glass) .header-actions,
        :host-context(body.has-glass) .settings-button,
        :host-context(body.has-glass) .icon-box {
            border-radius: 0 !important;
        }
        :host-context(body.has-glass) {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            will-change: auto !important;
        }
        `;

    constructor() {
        super();
        this.dragState = null;
        this.wasJustDragged = false;
        this.isVisible = true;
        this.isAnimating = false;
        
        // Assessment mode defaults
        this.focusedAppId = null;
        this.appSignatures = {};
        this.isAssessmentMode = false;
        this.timerDisplay = '90:00';
        this.wordCount = 0;
        this.assessmentActive = false;
        this.assessmentState = null;
        this.hasSlidIn = false;
        this.settingsHideTimer = null;
        this.appSignatures = {};
        this.animationEndTimer = null;
        
        // Assessment mode properties
        this.isAssessmentMode = false;
        this.timerDisplay = '90:00';
        this.wordCount = 0;
        this.assessmentActive = false;
        
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleAnimationEnd = this.handleAnimationEnd.bind(this);
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
        // Hide header completely unless in assessment mode
        if (this.assessmentState !== 'ASSESSMENT_IN_PROGRESS') {
            return html`<div style="display: none;"></div>`;
        }
        
        if (this.isAssessmentMode || this.assessmentState === 'ASSESSMENT_IN_PROGRESS') {
            // Assessment mode layout: [Focus Icon] [Timer] [Stop] [Word Counter] [Settings]
            return html`
                <div class="header" @mousedown=${this.handleMouseDown}>
                    <div class="assessment-header">
                        <!-- Focus Icon -->
                        ${(() => {
                            if (this.focusedAppId) {
                                const appInfo = this.getAppDisplayInfo(this.focusedAppId);
                                return html`
                                    <div class="focused-app-simple" title="Currently focused: ${appInfo.name}">
                                        <div class="focused-app-icon">
                                            ${appInfo.isImage 
                                                ? html`<img src="${appInfo.icon}" alt="${appInfo.name}" />` 
                                                : appInfo.icon
                                            }
                                        </div>
                                        <div class="focused-app-name">${appInfo.name}</div>
                                    </div>
                                `;
                            }
                            return html`
                                <div class="focused-app-simple" title="No app focused">
                                    <div class="focused-app-icon">⚪</div>
                                </div>
                            `;
                        })()}

                        <!-- Timer -->
                        <div class="assessment-timer ${this.getTimerClass()}" title="Time remaining">
                            ${this.timerDisplay}
                        </div>

                        <!-- Stop Button -->
                        <button class="stop-button" @click=${this.handleStopAssessment} title="Stop assessment">
                            Stop
                        </button>

                        <!-- Word Counter -->
                        <div class="word-counter ${this.wordCount > 0 ? 'active' : ''}" title="Current prompt words">
                            ${this.wordCount}w
                        </div>

                        <!-- Settings Button -->
                        <button 
                            class="settings-button-simple"
                            @mouseenter=${(e) => this.showWindow('settings', e.currentTarget)}
                            @mouseleave=${() => this.hideWindow('settings')}
                            title="Settings"
                        >
                            <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.0013 3.16406C7.82449 3.16406 7.65492 3.2343 7.5299 3.35932C7.40487 3.48435 7.33464 3.65392 7.33464 3.83073C7.33464 4.00754 7.40487 4.17711 7.5299 4.30213C7.65492 4.42716 7.82449 4.4974 8.0013 4.4974C8.17811 4.4974 8.34768 4.42716 8.47271 4.30213C8.59773 4.17711 8.66797 4.00754 8.66797 3.83073C8.66797 3.65392 8.59773 3.48435 8.47271 3.35932C8.34768 3.2343 8.17811 3.16406 8.0013 3.16406ZM8.0013 7.83073C7.82449 7.83073 7.65492 7.90097 7.5299 8.02599C7.40487 8.15102 7.33464 8.32058 7.33464 8.4974C7.33464 8.67421 7.40487 8.84378 7.5299 8.9688C7.65492 9.09382 7.82449 9.16406 8.0013 9.16406C8.17811 9.16406 8.34768 9.09382 8.47271 8.9688C8.59773 8.84378 8.66797 8.67421 8.66797 8.4974C8.66797 8.32058 8.59773 8.15102 8.47271 8.02599C8.34768 7.90097 8.17811 7.83073 8.0013 7.83073ZM8.0013 12.4974C7.82449 12.4974 7.65492 12.5676 7.5299 12.6927C7.40487 12.8177 7.33464 12.9873 7.33464 13.1641C7.33464 13.3409 7.40487 13.5104 7.5299 13.6355C7.65492 13.7605 7.82449 13.8307 8.0013 13.8307C8.17811 13.8307 8.34768 13.7605 8.47271 13.6355C8.59773 13.5104 8.66797 13.3409 8.66797 13.1641C8.66797 12.9873 8.59773 12.8177 8.47271 12.6927C8.34768 12.5676 8.17811 12.4974 8.0013 12.4974Z" fill="white" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }

        // Default mode layout (original)
        return html`
            <div class="header" @mousedown=${this.handleMouseDown}>

                <div class="header-actions ask-action" @click=${() => this.invoke('toggle-feature', 'ask')}>
                    <div class="action-text">
                        <div class="action-text-content">Ask</div>
                    </div>
                    <div class="icon-container ask-icons">
                        <div class="icon-box">⌘</div>
                        <div class="icon-box">
                            <svg viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M2.41797 8.16406C2.41797 8.00935 2.47943 7.86098 2.58882 7.75158C2.69822 7.64219 2.84659 7.58073 3.0013 7.58073H10.0013C10.4654 7.58073 10.9106 7.39636 11.2387 7.06817C11.5669 6.73998 11.7513 6.29486 11.7513 5.83073V3.4974C11.7513 3.34269 11.8128 3.19431 11.9222 3.08492C12.0316 2.97552 12.1799 2.91406 12.3346 2.91406C12.4893 2.91406 12.6377 2.97552 12.7471 3.08492C12.8565 3.19431 12.918 3.34269 12.918 3.4974V5.83073C12.918 6.60428 12.6107 7.34614 12.0637 7.89312C11.5167 8.44011 10.7748 8.7474 10.0013 8.7474H3.0013C2.84659 8.7474 2.69822 8.68594 2.58882 8.57654C2.47943 8.46715 2.41797 8.31877 2.41797 8.16406Z" fill="white"/>
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M2.58876 8.57973C2.4794 8.47034 2.41797 8.32199 2.41797 8.16731C2.41797 8.01263 2.4794 7.86429 2.58876 7.75489L4.92209 5.42156C5.03211 5.3153 5.17946 5.25651 5.33241 5.25783C5.48536 5.25916 5.63167 5.32051 5.73982 5.42867C5.84798 5.53682 5.90932 5.68313 5.91065 5.83608C5.91198 5.98903 5.85319 6.13638 5.74693 6.24639L3.82601 8.16731L5.74693 10.0882C5.80264 10.142 5.84708 10.2064 5.87765 10.2776C5.90823 10.3487 5.92432 10.4253 5.92499 10.5027C5.92566 10.5802 5.9109 10.657 5.88157 10.7287C5.85224 10.8004 5.80893 10.8655 5.75416 10.9203C5.69939 10.9751 5.63426 11.0184 5.56257 11.0477C5.49088 11.077 5.41406 11.0918 5.33661 11.0911C5.25916 11.0905 5.18261 11.0744 5.11144 11.0438C5.04027 11.0132 4.9759 10.9688 4.92209 10.9131L2.58876 8.57973Z" fill="white"/>
                            </svg>
                        </div>
                    </div>
                </div>

                ${(() => {
                    if (this.focusedAppId) {
                        const appInfo = this.getAppDisplayInfo(this.focusedAppId);
                        return html`
                            <div class="focused-app-indicator" title="Currently focused: ${appInfo.name}">
                                <div class="focused-app-icon">
                                    ${appInfo.isImage 
                                        ? html`<img src="${appInfo.icon}" alt="${appInfo.name}" />` 
                                        : appInfo.icon
                                    }
                                </div>
                                <div class="focused-app-name">
                                    ${appInfo.name}
                                </div>
                            </div>
                        `;
                    }
                    return '';
                })()}

                <div class="header-actions" @click=${() => this.invoke('toggle-all-windows-visibility')}>
                    <div class="action-text">
                        <div class="action-text-content">Show/Hide</div>
                    </div>
                    <div class="icon-container showhide-icons">
                        <div class="icon-box">⌘</div>
                        <div class="icon-box">
                            <svg viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1.50391 1.32812L5.16391 10.673" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </div>
                </div>

                <button 
                    class="settings-button"
                    @mouseenter=${(e) => this.showWindow('settings', e.currentTarget)}
                    @mouseleave=${() => this.hideWindow('settings')}
                >
                    <div class="settings-icon">
                        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.0013 3.16406C7.82449 3.16406 7.65492 3.2343 7.5299 3.35932C7.40487 3.48435 7.33464 3.65392 7.33464 3.83073C7.33464 4.00754 7.40487 4.17711 7.5299 4.30213C7.65492 4.42716 7.82449 4.4974 8.0013 4.4974C8.17811 4.4974 8.34768 4.42716 8.47271 4.30213C8.59773 4.17711 8.66797 4.00754 8.66797 3.83073C8.66797 3.65392 8.59773 3.48435 8.47271 3.35932C8.34768 3.2343 8.17811 3.16406 8.0013 3.16406ZM8.0013 7.83073C7.82449 7.83073 7.65492 7.90097 7.5299 8.02599C7.40487 8.15102 7.33464 8.32058 7.33464 8.4974C7.33464 8.67421 7.40487 8.84378 7.5299 8.9688C7.65492 9.09382 7.82449 9.16406 8.0013 9.16406C8.17811 9.16406 8.34768 9.09382 8.47271 8.9688C8.59773 8.84378 8.66797 8.67421 8.66797 8.4974C8.66797 8.32058 8.59773 8.15102 8.47271 8.02599C8.34768 7.90097 8.17811 7.83073 8.0013 7.83073ZM8.0013 12.4974C7.82449 12.4974 7.65492 12.5676 7.5299 12.6927C7.40487 12.8177 7.33464 12.9873 7.33464 13.1641C7.33464 13.3409 7.40487 13.5104 7.5299 13.6355C7.65492 13.7605 7.82449 13.8307 8.0013 13.8307C8.17811 13.8307 8.34768 13.7605 8.47271 13.6355C8.59773 13.5104 8.66797 13.3409 8.66797 13.1641C8.66797 12.9873 8.59773 12.8177 8.47271 12.6927C8.34768 12.5676 8.17811 12.4974 8.0013 12.4974Z" fill="white" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </button>
            </div>
        `;
    }
}

customElements.define('main-header', MainHeader);
