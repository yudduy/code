import { html, css, LitElement } from '../../../assets/vendor/lit-core-2.7.4.min.js';
import { applyDesignTokensToRoot } from '../../ui/styles/design-tokens.js';

export class StartAssessment extends LitElement {
    static properties = {
        isLoading: { type: Boolean }
    };

    static styles = css`
        * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            cursor: default;
            user-select: none;
        }

        :host {
            display: block;
            width: 100%;
            height: 100vh;
            background: #1A1D21; /* Primary Background - solid */
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
            animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
            0% {
                opacity: 0;
                transform: translate(-50%, -50%) translateY(12px);
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
            width: 48px; /* Smaller, more professional */
            height: 48px;
            background: #8257E5; /* Purple accent - solid color */
            border-radius: 6px; /* Professional radius */
            display: flex;
            align-items: center;
            justify-content: center;
            /* No animation, no box-shadow - clean and simple */
        }

        .assessment-logo svg {
            width: 24px;
            height: 24px;
            fill: #E1E1E6; /* Primary text color on accent background */
        }

        .assessment-title {
            font-size: 28px; /* Slightly smaller for professionalism */
            font-weight: 600;
            color: #E1E1E6; /* Primary text - no gradient */
            margin: 0;
        }

        .assessment-subtitle {
            font-size: 16px;
            color: #A8A8B3; /* Secondary text */
            margin: 0;
            line-height: 1.5;
            max-width: 400px;
        }

        .assessment-details {
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 24px;
            background: #24282F; /* Component Background - solid */
            border-radius: 6px; /* Professional radius */
            border: 1px solid rgba(255, 255, 255, 0.1); /* Subtle border */
            max-width: 480px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* Subtle shadow */
        }

        .assessment-detail-item {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #E1E1E6; /* Primary text */
            font-size: 14px;
        }

        .detail-icon {
            width: 20px;
            height: 20px;
            background: rgba(130, 87, 229, 0.1); /* Purple accent with low opacity */
            border-radius: 4px; /* Consistent radius */
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .detail-icon svg {
            width: 12px;
            height: 12px;
            fill: #8257E5; /* Purple accent */
        }

        .start-button {
            padding: 12px 24px; /* More generous padding */
            background: #8257E5; /* Purple accent - primary button */
            color: #E1E1E6; /* Primary text on accent background */
            border: 1px solid #8257E5;
            border-radius: 4px; /* Professional radius */
            font-size: 14px; /* Better readability */
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            min-width: 140px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .start-button:hover {
            background: #9466F0; /* Lighter purple on hover */
            border-color: #9466F0;
        }

        .start-button:active {
            background: #7347D4; /* Darker purple when pressed */
            border-color: #7347D4;
        }

        .start-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            background: #8257E5;
            border-color: #8257E5;
        }

        .button-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .loading-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(225, 225, 230, 0.3); /* Primary text with opacity */
            border-top: 2px solid #E1E1E6; /* Primary text */
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .assessment-footer {
            font-size: 12px;
            color: #A8A8B3; /* Secondary text */
            text-align: center;
            max-width: 360px;
            line-height: 1.4;
        }

        /* Responsive design - Clean and professional */
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
                padding: 12px 24px;
                width: 100%;
                max-width: 280px;
            }
        }
    `;

    constructor() {
        super();
        this.isLoading = false;
        
        // Apply design tokens to root for consistent styling
        applyDesignTokensToRoot();
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