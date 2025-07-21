import { html, css, LitElement } from '../../../assets/vendor/lit-core-2.7.4.min.js';
import { applyDesignTokensToRoot } from '../../ui/styles/design-tokens.js';

export class ConsentModal extends LitElement {
    static properties = {
        isVisible: { type: Boolean }
    };

    static styles = css`
        * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            cursor: default;
            user-select: none;
        }

        :host {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 10000;
            background: #1A1D21; /* Primary Background - solid, no transparency */
            opacity: 1;
            transition: opacity 0.2s ease;
        }

        :host(.visible) {
            opacity: 1;
        }

        :host(.hidden) {
            opacity: 0;
            pointer-events: none;
        }

        .consent-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 480px;
            max-width: 90vw;
            max-height: 90vh;
            background: #24282F; /* Component Background - solid */
            border: 1px solid rgba(255, 255, 255, 0.1); /* Subtle border */
            border-radius: 6px; /* Professional radius, not 16px */
            padding: 32px;
            box-sizing: border-box;
            color: #E1E1E6; /* Primary Text */
            display: flex;
            flex-direction: column;
            gap: 24px;
            position: relative;
            overflow-y: auto;
            overflow-x: hidden;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15); /* Subtle shadow instead of blur */
            
            /* Clean scrollbar styling */
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }

        .consent-container::-webkit-scrollbar {
            width: 6px;
        }

        .consent-container::-webkit-scrollbar-track {
            background: transparent;
        }

        .consent-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
        }

        .consent-container::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .consent-header {
            text-align: center;
            margin-bottom: 8px;
        }

        .consent-title {
            font-size: 24px;
            font-weight: 600;
            color: #E1E1E6; /* Primary Text */
            margin: 0 0 8px 0;
        }

        .consent-subtitle {
            font-size: 14px;
            color: #A8A8B3; /* Secondary Text */
            margin: 0;
            line-height: 1.4;
        }

        .consent-content {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .consent-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .consent-section-title {
            font-size: 16px;
            font-weight: 500;
            color: #E1E1E6; /* Primary Text */
            margin: 0;
        }

        .consent-section-text {
            font-size: 14px;
            color: #E1E1E6; /* Primary Text for body content */
            line-height: 1.5;
            margin: 0;
        }

        .consent-list {
            margin: 0;
            padding-left: 16px;
            color: #E1E1E6; /* Primary Text for list items */
            font-size: 14px;
            line-height: 1.5;
        }

        .consent-list li {
            margin-bottom: 4px;
        }

        .consent-emphasis {
            color: #8257E5; /* Purple accent color */
            font-weight: 500;
        }

        .consent-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-top: 8px;
        }

        .consent-button {
            padding: 8px 16px;
            border-radius: 4px; /* Professional radius */
            font-size: 14px; /* Slightly larger for better readability */
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            min-width: 100px;
            outline: none;
            border: none;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .consent-button-primary {
            background: #8257E5; /* Purple accent */
            color: #E1E1E6; /* Primary text on accent background */
            border: 1px solid #8257E5;
        }

        .consent-button-primary:hover {
            background: #9466F0; /* Lighter purple on hover */
            border-color: #9466F0;
        }

        .consent-button-primary:active {
            background: #7347D4; /* Darker purple when pressed */
            border-color: #7347D4;
        }

        .consent-button-secondary {
            background: transparent;
            color: #E1E1E6; /* Primary text */
            border: 1px solid rgba(255, 255, 255, 0.1); /* Subtle border */
        }

        .consent-button-secondary:hover {
            border-color: rgba(255, 255, 255, 0.2); /* More prominent border on hover */
            background: rgba(255, 255, 255, 0.05); /* Very subtle background */
        }

        .consent-button-secondary:active {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.3);
        }

        .consent-footer {
            text-align: center;
            font-size: 12px;
            color: #A8A8B3; /* Secondary text */
            margin-top: 8px;
        }

        /* Subtle, professional animation */
        .consent-container {
            animation: modalAppear 0.2s ease-out;
        }

        @keyframes modalAppear {
            0% {
                opacity: 0;
                transform: translate(-50%, -50%) translateY(8px);
            }
            100% {
                opacity: 1;
                transform: translate(-50%, -50%) translateY(0);
            }
        }

        /* Responsive design - Clean and professional */
        @media (max-width: 600px) {
            .consent-container {
                width: 95vw;
                padding: 24px;
                max-height: 95vh;
            }
            
            .consent-title {
                font-size: 20px;
            }
            
            .consent-actions {
                flex-direction: column;
                gap: 8px;
            }
            
            .consent-button {
                width: 100%;
            }
        }

        /* Height-based responsive design for shorter screens */
        @media (max-height: 600px) {
            .consent-container {
                max-height: 95vh;
                padding: 20px;
                gap: 16px;
            }

            .consent-title {
                font-size: 20px;
                margin-bottom: 4px;
            }

            .consent-subtitle {
                font-size: 13px;
            }

            .consent-section-title {
                font-size: 15px;
            }

            .consent-section-text, .consent-list {
                font-size: 13px;
                line-height: 1.4;
            }
        }

        /* Compact layout for very short screens */
        @media (max-height: 480px) {
            .consent-container {
                max-height: 98vh;
                padding: 16px;
                gap: 12px;
                top: 2vh;
                transform: translate(-50%, 0);
            }

            .consent-title {
                font-size: 18px;
            }

            .consent-section-text, .consent-list {
                font-size: 12px;
            }
        }
    `;

    constructor() {
        super();
        this.isVisible = false;
        
        // Apply design tokens to root for consistent styling
        applyDesignTokensToRoot();
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('[ConsentModal] Connected and showing immediately');
        // Show modal immediately without delay
        this.isVisible = true;
        this.classList.add('visible');
    }

    handleAccept() {
        this.dispatchEvent(new CustomEvent('consent-accepted', {
            bubbles: true,
            composed: true
        }));
        this.hide();
    }

    handleDecline() {
        this.dispatchEvent(new CustomEvent('consent-declined', {
            bubbles: true,
            composed: true
        }));
        this.hide();
    }

    hide() {
        this.classList.remove('visible');
        setTimeout(() => {
            this.remove();
        }, 300);
    }

    render() {
        return html`
            <div class="consent-container">
                <div class="consent-header">
                    <h1 class="consent-title">Codexel Assessment</h1>
                    <p class="consent-subtitle">Privacy & Data Collection Consent</p>
                </div>

                <div class="consent-content">
                    <div class="consent-section">
                        <h3 class="consent-section-title">What we collect</h3>
                        <p class="consent-section-text">
                            During your 90-minute assessment, we will collect <span class="consent-emphasis">minimal telemetry data</span> to evaluate your AI-collaboration skills:
                        </p>
                        <ul class="consent-list">
                            <li><strong>Application Focus:</strong> Which applications you switch between (e.g., VS Code, ChatGPT, browser)</li>
                            <li><strong>Prompt Submissions:</strong> When you submit prompts to AI tools (text content optional)</li>
                        </ul>
                    </div>

                    <div class="consent-section">
                        <h3 class="consent-section-title">What we don't collect</h3>
                        <ul class="consent-list">
                            <li>Screen recordings or screenshots</li>
                            <li>Keystroke logging or detailed typing behavior</li>
                            <li>File contents or source code</li>
                            <li>Personal information beyond assessment data</li>
                        </ul>
                    </div>

                    <div class="consent-section">
                        <h3 class="consent-section-title">Data usage</h3>
                        <p class="consent-section-text">
                            This data is used solely for <span class="consent-emphasis">assessment evaluation</span> and will be processed according to our privacy policy.
                        </p>
                    </div>
                </div>

                <div class="consent-actions">
                    <button class="consent-button consent-button-secondary" @click=${this.handleDecline}>
                        Decline
                    </button>
                    <button class="consent-button consent-button-primary" @click=${this.handleAccept}>
                        Accept & Continue
                    </button>
                </div>

                <div class="consent-footer">
                    By continuing, you agree to participate in the Codexel assessment under these terms.
                </div>
            </div>
        `;
    }
}

customElements.define('consent-modal', ConsentModal);