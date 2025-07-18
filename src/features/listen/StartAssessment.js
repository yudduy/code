import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class StartAssessment extends LitElement {
    static properties = {
        isLoading: { type: Boolean }
    };

    static styles = css`
        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
        }

        :host {
            display: block;
            width: 100%;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
        }

        .assessment-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 32px;
            text-align: center;
            animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
            0% {
                opacity: 0;
                transform: translate(-50%, -50%) translateY(20px);
            }
            100% {
                opacity: 1;
                transform: translate(-50%, -50%) translateY(0);
            }
        }

        .assessment-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
        }

        .assessment-logo {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #007aff 0%, #0056b3 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 32px rgba(0, 122, 255, 0.3);
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
                box-shadow: 0 8px 32px rgba(0, 122, 255, 0.3);
            }
            50% {
                transform: scale(1.05);
                box-shadow: 0 12px 40px rgba(0, 122, 255, 0.4);
            }
        }

        .assessment-logo svg {
            width: 32px;
            height: 32px;
            fill: white;
        }

        .assessment-title {
            font-size: 32px;
            font-weight: 600;
            color: white;
            margin: 0;
            background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .assessment-subtitle {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.7);
            margin: 0;
            line-height: 1.5;
            max-width: 400px;
        }

        .assessment-details {
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 24px;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            max-width: 480px;
        }

        .assessment-detail-item {
            display: flex;
            align-items: center;
            gap: 12px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
        }

        .detail-icon {
            width: 20px;
            height: 20px;
            background: rgba(0, 122, 255, 0.2);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .detail-icon svg {
            width: 12px;
            height: 12px;
            fill: #007aff;
        }

        .start-button {
            padding: 8px 16px;
            background: transparent;
            color: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 5px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s cubic-bezier(0.23, 1, 0.32, 1);
            position: relative;
            overflow: hidden;
            min-width: 120px;
        }

        .start-button:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .start-button:active {
            background: rgba(255, 255, 255, 0.15);
        }

        .start-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            background: transparent;
        }

        .start-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s ease;
        }

        .start-button:hover::before {
            left: 100%;
        }

        .button-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            position: relative;
            z-index: 1;
        }

        .loading-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .assessment-footer {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            text-align: center;
            max-width: 360px;
            line-height: 1.4;
        }

        /* Responsive design */
        @media (max-width: 600px) {
            .assessment-container {
                padding: 20px;
                gap: 24px;
            }
            
            .assessment-title {
                font-size: 24px;
            }
            
            .assessment-details {
                padding: 20px;
                max-width: none;
            }
            
            .start-button {
                padding: 14px 32px;
                width: 100%;
                max-width: 280px;
            }
        }
    `;

    constructor() {
        super();
        this.isLoading = false;
    }

    async handleStartAssessment() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        try {
            // Emit event to start the assessment
            this.dispatchEvent(new CustomEvent('start-assessment', {
                bubbles: true,
                composed: true,
                detail: {
                    action: 'start'
                }
            }));
            
            // Add delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error('Error starting assessment:', error);
        } finally {
            this.isLoading = false;
        }
    }

    render() {
        return html`
            <div class="assessment-container">
                <div class="assessment-header">
                    <div class="assessment-logo">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </div>
                    
                    <h1 class="assessment-title">Ready to Begin</h1>
                    <p class="assessment-subtitle">
                        You're about to start your AI-collaboration assessment. 
                        The session will last 90 minutes and track your workflow with AI tools.
                    </p>
                </div>

                <div class="assessment-details">
                    <div class="assessment-detail-item">
                        <div class="detail-icon">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                        </div>
                        <span>GitHub repository will open for your coding task</span>
                    </div>
                    
                    <div class="assessment-detail-item">
                        <div class="detail-icon">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.72-2.97-.01-2.2-1.9-2.96-3.65-3.22z"/>
                            </svg>
                        </div>
                        <span>90-minute timer will start automatically</span>
                    </div>
                    
                    <div class="assessment-detail-item">
                        <div class="detail-icon">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                        </div>
                        <span>Minimal telemetry will track your AI tool usage</span>
                    </div>
                </div>

                <button 
                    class="start-button" 
                    @click=${this.handleStartAssessment}
                    ?disabled=${this.isLoading}
                >
                    <div class="button-content">
                        ${this.isLoading 
                            ? html`<div class="loading-spinner"></div><span>Starting...</span>`
                            : html`<span>Start Assessment</span>`
                        }
                    </div>
                </button>

                <div class="assessment-footer">
                    Once started, you can use any AI tools you prefer. The assessment will automatically 
                    end after 90 minutes or when you click the stop button in the header.
                </div>
            </div>
        `;
    }
}

customElements.define('start-assessment', StartAssessment);