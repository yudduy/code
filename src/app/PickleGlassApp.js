import { html, css, LitElement } from '../assets/vendor/lit-core-2.7.4.min.js';
import { SettingsView } from '../features/settings/SettingsView.js';
import { AssistantView } from '../features/telemetry/components/TelemetryView.js';
import { ConsentModal } from '../features/assessment/components/ConsentModal.js';
import { StartAssessment } from '../features/assessment/components/StartAssessment.js';
import { MainHeader } from '../features/ui/components/MainHeader.js';

import '../core/renderer/renderer.js';

export class PickleGlassApp extends LitElement {
    static styles = css`
        :host {
            display: block;
            width: 100vw;
            height: 100vh;
            min-height: 100vh;
            color: var(--text-color);
            background: transparent;
            border-radius: 7px;
            position: relative;
            overflow: visible;
        }

        assistant-view {
            display: block;
            width: 100%;
            height: 100%;
        }

        settings-view, history-view, help-view, setup-view {
            display: block;
            width: 100%;
            height: 100%;
        }

        .assessment-container {
            padding: 20px;
            text-align: center;
            color: var(--text-color);
        }

        .assessment-status {
            font-size: 14px;
            opacity: 0.7;
        }

        .assessment-complete {
            padding: 40px;
            text-align: center;
            color: var(--text-color);
        }

        .assessment-complete h2 {
            margin-bottom: 20px;
            color: var(--text-color);
        }

        .assessment-complete button {
            background: var(--start-button-background);
            color: var(--start-button-color);
            border: 1px solid var(--start-button-border);
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 20px;
        }

        .assessment-complete button:hover {
            background: var(--start-button-hover-background);
        }

        .error {
            padding: 20px;
            color: #ff6b6b;
            text-align: center;
        }

    `;

    static properties = {
        // Legacy properties (maintained for compatibility)
        currentView: { type: String },
        statusText: { type: String },
        startTime: { type: Number },
        currentResponseIndex: { type: Number },
        isMainViewVisible: { type: Boolean },
        selectedProfile: { type: String },
        selectedLanguage: { type: String },
        selectedScreenshotInterval: { type: String },
        selectedImageQuality: { type: String },
        isClickThrough: { type: Boolean, state: true },
        layoutMode: { type: String },
        _viewInstances: { type: Object, state: true },
        _isClickThrough: { state: true },
        structuredData: { type: Object },
        
        // Codexel Assessment state management
        assessmentState: { type: String, state: true },
        assessmentSessionId: { type: String, state: true },
        assessmentTimer: { type: Object, state: true },
        
        // Header state for assessment mode
        timerDisplay: { type: String, state: true },
        wordCount: { type: Number, state: true },
        focusedAppId: { type: String, state: true },
    };

    constructor() {
        super();
        const urlParams = new URLSearchParams(window.location.search);
        
        // Initialize Codexel Assessment flow with state management
        this.assessmentState = 'AWAITING_CONSENT';
        this.assessmentSessionId = null;
        this.assessmentTimer = null;
        
        // Header state for assessment mode
        this.timerDisplay = '90:00';
        this.wordCount = 0;
        this.focusedAppId = null;
        
        // Legacy properties (maintained for compatibility)
        this.currentView = 'consent';
        this.currentResponseIndex = -1;
        this.selectedProfile = localStorage.getItem('selectedProfile') || 'interview';
        
        // Language format migration for legacy users
        let lang = localStorage.getItem('selectedLanguage') || 'en';
        if (lang.includes('-')) {
            const newLang = lang.split('-')[0];
            console.warn(`[Migration] Correcting language format from "${lang}" to "${newLang}".`);
            localStorage.setItem('selectedLanguage', newLang);
            lang = newLang;
        }
        this.selectedLanguage = lang;

        this.selectedScreenshotInterval = localStorage.getItem('selectedScreenshotInterval') || '5';
        this.selectedImageQuality = localStorage.getItem('selectedImageQuality') || 'medium';
        this._isClickThrough = false;
        this.outlines = [];
        this.analysisRequests = [];

        // Initialize structured data callback (legacy)
        if (window.pickleGlass) {
            window.pickleGlass.setStructuredData = data => {
                this.updateStructuredData(data);
            };
        }

        console.log('[PickleGlassApp] Initialized with Codexel Assessment flow');
        console.log('[PickleGlassApp] Initial assessmentState:', this.assessmentState);
        
        // Force initial render to ensure ConsentModal displays
        this.requestUpdate();
    }

    connectedCallback() {
        super.connectedCallback();
        
        console.log('[PickleGlassApp] Connected to DOM');
        console.log('[PickleGlassApp] ConsentModal defined:', !!customElements.get('consent-modal'));
        console.log('[PickleGlassApp] Current assessmentState on connect:', this.assessmentState);
        
        // Debug electronAPI availability
        console.log('[PickleGlassApp] window.electronAPI available:', !!window.electronAPI);
        if (window.electronAPI) {
            console.log('[PickleGlassApp] electronAPI methods:', Object.keys(window.electronAPI));
            console.log('[PickleGlassApp] openExternal available:', !!window.electronAPI.openExternal);
            console.log('[PickleGlassApp] openExternal type:', typeof window.electronAPI.openExternal);
        }
        
        if (window.electronAPI) {
            // Note: These legacy IPC events would need to be added to preload.js if needed
            // window.electronAPI.onUpdateStatus((status) => this.setStatus(status));
            // window.electronAPI.onClickThroughToggled((isEnabled) => {
            //     this._isClickThrough = isEnabled;
            // });
            // window.electronAPI.onStartListeningSession(() => {
            //     console.log('Received start-listening-session command, calling handleListenClick.');
            //     this.handleListenClick();
            // });
        }

        // Add event listeners for consent and assessment flow
        this.addEventListener('consent-accepted', this.handleConsentAccepted.bind(this));
        this.addEventListener('consent-declined', this.handleConsentDeclined.bind(this));
        this.addEventListener('start-assessment', this.handleStartAssessment.bind(this));
        this.addEventListener('stop-assessment', this.handleStopAssessment.bind(this));
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (window.electronAPI) {
            // Note: These legacy IPC event removals would need to be handled in preload.js if needed
            // window.electronAPI.removeUpdateStatusListener();
            // window.electronAPI.removeClickThroughToggledListener();
            // window.electronAPI.removeStartListeningSessionListener();
        }
    }

    updated(changedProperties) {
        if (changedProperties.has('isMainViewVisible') || changedProperties.has('currentView')) {
            this.requestWindowResize();
        }

        if (changedProperties.has('currentView')) {
            const viewContainer = this.shadowRoot?.querySelector('.view-container');
            if (viewContainer) {
                viewContainer.classList.add('entering');
                requestAnimationFrame(() => {
                    viewContainer.classList.remove('entering');
                });
            }
        }

        // Only update localStorage when these specific properties change
        if (changedProperties.has('selectedProfile')) {
            localStorage.setItem('selectedProfile', this.selectedProfile);
        }
        if (changedProperties.has('selectedLanguage')) {
            localStorage.setItem('selectedLanguage', this.selectedLanguage);
        }
        if (changedProperties.has('selectedScreenshotInterval')) {
            localStorage.setItem('selectedScreenshotInterval', this.selectedScreenshotInterval);
        }
        if (changedProperties.has('selectedImageQuality')) {
            localStorage.setItem('selectedImageQuality', this.selectedImageQuality);
        }
        if (changedProperties.has('layoutMode')) {
            this.updateLayoutMode();
        }
    }

    requestWindowResize() {
        if (window.electronAPI) {
            // Note: resize-window IPC would need to be added to preload.js if needed
            // window.electronAPI.resizeWindow({
            //     isMainViewVisible: this.isMainViewVisible,
            //     view: this.currentView,
            // });
        }
    }

    setStatus(text) {
        this.statusText = text;
    }

    async handleListenClick() {
        if (window.electronAPI) {
            // Note: is-session-active IPC would need to be added to preload.js if needed
            // const isActive = await window.electronAPI.isSessionActive();
            // if (isActive) {
            //     console.log('Session is already active. No action needed.');
            //     return;
            // }
        }

        if (window.pickleGlass) {
            await window.pickleGlass.initializeopenai(this.selectedProfile, this.selectedLanguage);
            window.pickleGlass.startCapture(this.selectedScreenshotInterval, this.selectedImageQuality);
        }

        // 🔄 Clear previous summary/analysis when a new listening session begins
        this.structuredData = {
            summary: [],
            topic: { header: '', bullets: [] },
            actions: [],
            followUps: [],
        };

        this.currentResponseIndex = -1;
        this.startTime = Date.now();
        this.currentView = 'listen';
        this.isMainViewVisible = true;
    }

    handleShowHideClick() {
        this.isMainViewVisible = !this.isMainViewVisible;
    }

    handleSettingsClick() {
        this.currentView = 'settings';
        this.isMainViewVisible = true;
    }

    handleHelpClick() {
        this.currentView = 'help';
        this.isMainViewVisible = true;
    }

    handleHistoryClick() {
        this.currentView = 'history';
        this.isMainViewVisible = true;
    }

    async handleClose() {
        if (window.electronAPI) {
            await window.electronAPI.quitApplication();
        }
    }

    handleBackClick() {
        this.currentView = 'listen';
    }

    async handleSendText(message) {
        if (window.pickleGlass) {
            const result = await window.pickleGlass.sendTextMessage(message);

            if (!result.success) {
                console.error('Failed to send message:', result.error);
                this.setStatus('Error sending message: ' + result.error);
            } else {
                this.setStatus('Message sent...');
            }
        }
    }

    // updateOutline(outline) {
    //     console.log('📝 PickleGlassApp updateOutline:', outline);
    //     this.outlines = [...outline];
    //     this.requestUpdate();
    // }

    // updateAnalysisRequests(requests) {
    //     console.log('📝 PickleGlassApp updateAnalysisRequests:', requests);
    //     this.analysisRequests = [...requests];
    //     this.requestUpdate();
    // }

    updateStructuredData(data) {
        console.log('📝 PickleGlassApp updateStructuredData:', data);
        this.structuredData = data;
        this.requestUpdate();
        
        const assistantView = this.shadowRoot?.querySelector('assistant-view');
        if (assistantView) {
            assistantView.structuredData = data;
            console.log('✅ Structured data passed to AssistantView');
        }
    }

    handleResponseIndexChanged(e) {
        this.currentResponseIndex = e.detail.index;
    }

    /**
     * Handle consent accepted event
     */
    handleConsentAccepted() {
        console.log('[PickleGlassApp] Consent accepted');
        this.assessmentState = 'READY_TO_START';
    }

    /**
     * Handle consent declined event
     */
    handleConsentDeclined() {
        console.log('[PickleGlassApp] Consent declined');
        
        // Close the application
        if (window.electronAPI) {
            window.electronAPI.quitApplication();
        }
    }

    /**
     * Handle start assessment event
     */
    async handleStartAssessment() {
        console.log('[PickleGlassApp] Starting assessment');
        
        try {
            // Generate session ID
            this.assessmentSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Open GitHub URL in default browser
            if (window.electronAPI) {
                console.log('[PickleGlassApp] About to call openExternal');
                console.log('[PickleGlassApp] openExternal method:', window.electronAPI.openExternal);
                
                if (window.electronAPI.openExternal) {
                    try {
                        await window.electronAPI.openExternal('https://github.com/');
                        console.log('[PickleGlassApp] GitHub URL opened successfully');
                    } catch (openError) {
                        console.error('[PickleGlassApp] Error opening GitHub URL:', openError);
                        // Continue with assessment even if URL opening fails
                    }
                } else {
                    console.error('[PickleGlassApp] openExternal method not available in electronAPI');
                    console.log('[PickleGlassApp] Available methods:', Object.keys(window.electronAPI));
                    console.log('[PickleGlassApp] Continuing assessment without opening GitHub URL');
                }
            } else {
                console.error('[PickleGlassApp] window.electronAPI not available');
                console.log('[PickleGlassApp] Continuing assessment without opening GitHub URL');
            }
            
            // Start telemetry and timer
            await this.startAssessmentTelemetry();
            
            // Switch to assessment mode
            this.assessmentState = 'ASSESSMENT_IN_PROGRESS';
            
            // Collapse window to header bar
            this.collapseToHeaderBar();
            
            console.log('[PickleGlassApp] Assessment started with session ID:', this.assessmentSessionId);
            
        } catch (error) {
            console.error('[PickleGlassApp] Error starting assessment:', error);
        }
    }

    /**
     * Handle stop assessment event
     */
    async handleStopAssessment() {
        console.log('[PickleGlassApp] Stopping assessment');
        
        try {
            // Stop telemetry and timer
            this.stopAssessmentTelemetry();
            
            // Reset assessment state
            this.assessmentState = 'ASSESSMENT_COMPLETE';
            this.assessmentSessionId = null;
            
            console.log('[PickleGlassApp] Assessment stopped');
            
        } catch (error) {
            console.error('[PickleGlassApp] Error stopping assessment:', error);
        }
    }

    /**
     * Start assessment telemetry (timer, focus tracking, prompt listening)
     */
    async startAssessmentTelemetry() {
        // Import and initialize AssessmentTimer
        const { default: AssessmentTimer } = await import('../features/assessment/components/AssessmentTimer.js');
        
        this.assessmentTimer = new AssessmentTimer({
            duration: 90 * 60 * 1000, // 90 minutes
            onUpdate: (remainingTime, formattedTime) => {
                this.timerDisplay = formattedTime;
                this.updateHeaderTimer(formattedTime);
            },
            onComplete: () => {
                console.log('[PickleGlassApp] Assessment timer completed');
                this.handleStopAssessment();
            }
        });
        
        this.assessmentTimer.start();
        
        // Enable header assessment mode
        this.enableHeaderAssessmentMode();
        
        // Start telemetry services (focus detection, prompt listening)
        this.startTelemetryServices();
        
        // Listen for focus changes from main process
        this.setupFocusListener();
    }

    /**
     * Stop assessment telemetry
     */
    stopAssessmentTelemetry() {
        if (this.assessmentTimer) {
            this.assessmentTimer.stop();
            this.assessmentTimer.destroy();
            this.assessmentTimer = null;
        }
        
        // Disable header assessment mode
        this.disableHeaderAssessmentMode();
        
        // Stop telemetry services
        this.stopTelemetryServices();
    }

    /**
     * Collapse window to header bar only
     */
    collapseToHeaderBar() {
        if (window.electronAPI) {
            window.electronAPI.collapseToHeader();
        }
    }

    /**
     * Enable header assessment mode
     */
    enableHeaderAssessmentMode() {
        // This would need to communicate with the header component
        // For now, we'll use a simple event dispatch
        this.dispatchEvent(new CustomEvent('enable-assessment-mode', {
            bubbles: true,
            composed: true,
            detail: { initialTimer: '90:00' }
        }));
    }

    /**
     * Disable header assessment mode
     */
    disableHeaderAssessmentMode() {
        this.dispatchEvent(new CustomEvent('disable-assessment-mode', {
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Update header timer display
     */
    updateHeaderTimer(formattedTime) {
        this.dispatchEvent(new CustomEvent('update-timer', {
            bubbles: true,
            composed: true,
            detail: { timerText: formattedTime }
        }));
    }

    /**
     * Start telemetry services (focus detection, prompt listening)
     */
    startTelemetryServices() {
        // This would integrate with existing telemetry infrastructure
        console.log('[PickleGlassApp] Starting telemetry services for session:', this.assessmentSessionId);
        
        // Focus detection should already be running via focusDetector
        // Prompt listening would be initialized here
        if (window.PromptListener) {
            const promptListener = new window.PromptListener();
            promptListener.setConsent(this.consentGiven);
            promptListener.start(this.assessmentSessionId);
            
            // Set up word count callback
            promptListener.onWordCountChange((wordCount) => {
                this.wordCount = wordCount;
                this.updateHeaderWordCount(wordCount);
            });
        }
    }

    /**
     * Stop telemetry services
     */
    stopTelemetryServices() {
        console.log('[PickleGlassApp] Stopping telemetry services');
        
        // Stop prompt listening
        if (window.PromptListener) {
            // Would need to maintain reference to stop properly
            // This is a simplified version
        }
    }

    /**
     * Update header word count display
     */
    updateHeaderWordCount(wordCount) {
        this.dispatchEvent(new CustomEvent('update-word-count', {
            bubbles: true,
            composed: true,
            detail: { wordCount }
        }));
    }

    /**
     * Setup focus change listener for updating header
     */
    setupFocusListener() {
        if (window.electronAPI) {
            window.electronAPI.onFocusChange((event, focusEvent) => {
                if (focusEvent && focusEvent.appId) {
                    this.focusedAppId = focusEvent.appId;
                    console.log('[PickleGlassApp] Focus changed to:', focusEvent.appId);
                }
            });
        }
    }

    render() {
        console.log('[PickleGlassApp] Rendering with assessmentState:', this.assessmentState);
        // State-driven rendering based on assessmentState
        switch (this.assessmentState) {
            case 'AWAITING_CONSENT':
                console.log('[PickleGlassApp] Rendering ConsentModal');
                return html`<consent-modal></consent-modal>`;
                
            case 'READY_TO_START':
                return html`<start-assessment></start-assessment>`;
                
            case 'ASSESSMENT_IN_PROGRESS':
                return html`
                    <main-header
                        .assessmentState=${this.assessmentState}
                        .timerDisplay=${this.timerDisplay}
                        .wordCount=${this.wordCount}
                        .focusedAppId=${this.focusedAppId}
                        @stop-assessment=${this.handleStopAssessment}
                    ></main-header>
                    <div class="assessment-container">
                        <div class="assessment-status">Assessment in progress...</div>
                    </div>
                `;
                
            case 'ASSESSMENT_COMPLETE':
                return html`
                    <div class="assessment-complete">
                        <h2>Assessment Complete</h2>
                        <p>Thank you for completing the Codexel assessment.</p>
                        <button @click=${this.handleClose}>Close Application</button>
                    </div>
                `;
                
            // Legacy fallback views (for backward compatibility)
            case 'legacy':
                return this.renderLegacyView();
                
            default:
                console.warn('[PickleGlassApp] Unknown assessment state:', this.assessmentState);
                return html`<div class="error">Unknown assessment state: ${this.assessmentState}</div>`;
        }
    }

    /**
     * Legacy view rendering for backward compatibility
     */
    renderLegacyView() {
        switch (this.currentView) {
            case 'listen':
                return html`<assistant-view
                    .currentResponseIndex=${this.currentResponseIndex}
                    .selectedProfile=${this.selectedProfile}
                    .structuredData=${this.structuredData}
                    .onSendText=${message => this.handleSendText(message)}
                    @response-index-changed=${e => (this.currentResponseIndex = e.detail.index)}
                ></assistant-view>`;
                
            case 'settings':
                return html`<settings-view
                    .selectedProfile=${this.selectedProfile}
                    .selectedLanguage=${this.selectedLanguage}
                    .onProfileChange=${profile => (this.selectedProfile = profile)}
                    .onLanguageChange=${lang => (this.selectedLanguage = lang)}
                ></settings-view>`;
                
            case 'history':
                return html`<history-view></history-view>`;
                
            case 'help':
                return html`<help-view></help-view>`;
                
            case 'setup':
                return html`<setup-view></setup-view>`;
                
            default:
                return html`<div>Unknown legacy view: ${this.currentView}</div>`;
        }
    }
}

customElements.define('pickle-glass-app', PickleGlassApp);
