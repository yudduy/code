import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class ConsentModal extends LitElement {
    static properties = {
        isVisible: { type: Boolean }
    };

    static styles = css`
        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(10px);
            opacity: 1;
            transition: opacity 0.3s ease;
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
            background: rgba(0, 0, 0, 0.8);
            border-radius: 16px;
            padding: 32px;
            box-sizing: border-box;
            color: white;
            display: flex;
            flex-direction: column;
            gap: 24px;
            position: relative;
            overflow-y: auto;
            overflow-x: hidden;
            
            /* Custom scrollbar styling for glassmorphism */
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
        }

        .consent-container::-webkit-scrollbar {
            width: 6px;
        }

        .consent-container::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
        }

        .consent-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
        }

        .consent-container::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .consent-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.15);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border-radius: 16px;
            z-index: -1;
        }

        .consent-container::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 16px;
            padding: 1px;
            background: linear-gradient(169deg, rgba(255, 255, 255, 0.17) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.17) 100%);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: destination-out;
            mask-composite: exclude;
            pointer-events: none;
        }

        .consent-header {
            text-align: center;
            margin-bottom: 8px;
        }

        .consent-title {
            font-size: 24px;
            font-weight: 600;
            color: white;
            margin: 0 0 8px 0;
        }

        .consent-subtitle {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
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
            color: white;
            margin: 0;
        }

        .consent-section-text {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.5;
            margin: 0;
        }

        .consent-list {
            margin: 0;
            padding-left: 16px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            line-height: 1.5;
        }

        .consent-list li {
            margin-bottom: 4px;
        }

        .consent-emphasis {
            color: #007aff;
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
            border-radius: 5px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s cubic-bezier(0.23, 1, 0.32, 1);
            min-width: 80px;
            outline: none;
            background: transparent;
            color: rgba(255, 255, 255, 0.9);
        }

        .consent-button-primary {
            background: transparent;
            color: rgba(255, 255, 255, 0.9);
        }

        .consent-button-primary:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .consent-button-secondary {
            background: transparent;
            color: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .consent-button-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .consent-button:active {
            background: rgba(255, 255, 255, 0.15);
        }

        .consent-footer {
            text-align: center;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            margin-top: 8px;
        }

        /* Animation for modal appearance */
        .consent-container {
            animation: modalAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes modalAppear {
            0% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.9);
            }
            100% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }

        /* Responsive design */
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
            }
            
            .consent-button {
                width: 100%;
            }
        }

        /* Height-based responsive design for very short screens */
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

        /* Extra small height screens (like landscape mobile) */
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