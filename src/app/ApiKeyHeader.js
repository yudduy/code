import { html, css, LitElement } from "../assets/lit-core-2.7.4.min.js"

export class ApiKeyHeader extends LitElement {
  //////// after_modelStateService ////////
  static properties = {
    llmApiKey: { type: String },
    sttApiKey: { type: String },
    llmProvider: { type: String },
    sttProvider: { type: String },
    isLoading: { type: Boolean },
    errorMessage: { type: String },
    providers: { type: Object, state: true },
  }
  //////// after_modelStateService ////////

  static styles = css`
        :host {
            display: block;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            transition: opacity 0.25s ease-out;
        }

        :host(.sliding-out) {
            animation: slideOutUp 0.3s ease-in forwards;
            will-change: opacity, transform;
        }

        :host(.hidden) {
            opacity: 0;
            pointer-events: none;
        }

        @keyframes slideOutUp {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-20px);
            }
        }

        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
            box-sizing: border-box;
        }

        .container {
            width: 350px;
            min-height: 260px;
            padding: 18px 20px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 16px;
            overflow: visible;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .container::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 16px;
            padding: 1px;
            background: linear-gradient(169deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.5) 100%);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: destination-out;
            mask-composite: exclude;
            pointer-events: none;
        }

        .close-button {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 14px;
            height: 14px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 3px;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
            z-index: 10;
            font-size: 14px;
            line-height: 1;
            padding: 0;
        }

        .close-button:hover {
            background: rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 0.9);
        }

        .close-button:active {
            transform: scale(0.95);
        }

        .title {
            color: white;
            font-size: 16px;
            font-weight: 500; /* Medium */
            margin: 0;
            text-align: center;
            flex-shrink: 0;
        }

        .form-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            margin-top: auto;
        }

        .error-message {
            color: rgba(239, 68, 68, 0.9);
            font-weight: 500;
            font-size: 11px;
            height: 14px;
            text-align: center;
            margin-bottom: 4px;
        }

        .api-input {
            width: 100%;
            height: 34px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            border: none;
            padding: 0 10px;
            color: white;
            font-size: 12px;
            font-weight: 400; /* Regular */
            margin-bottom: 6px;
            text-align: center;
            user-select: text;
            cursor: text;
        }

        .api-input::placeholder {
            color: rgba(255, 255, 255, 0.6);
        }

        .api-input:focus {
            outline: none;
        }

        .providers-container { display: flex; gap: 12px; width: 100%; }
        .provider-column { flex: 1; display: flex; flex-direction: column; align-items: center; }
        .provider-label { color: rgba(255, 255, 255, 0.7); font-size: 11px; font-weight: 500; margin-bottom: 6px; }
        .api-input, .provider-select {
            width: 100%;
            height: 34px;
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 0 10px;
            color: white;
            font-size: 12px;
            margin-bottom: 6px;
        }
        .provider-select option { background: #1a1a1a; color: white; }

        .provider-select:hover {
            background-color: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.3);
        }

        .provider-select:focus {
            outline: none;
            background-color: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.4);
        }


        .action-button {
            width: 100%;
            height: 34px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 12px;
            font-weight: 500; /* Medium */
            cursor: pointer;
            transition: background 0.15s ease;
            position: relative;
            overflow: visible;
        }

        .action-button::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 10px;
            padding: 1px;
            background: linear-gradient(169deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.5) 100%);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: destination-out;
            mask-composite: exclude;
            pointer-events: none;
        }

        .action-button:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .action-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .or-text {
            color: rgba(255, 255, 255, 0.5);
            font-size: 12px;
            font-weight: 500; /* Medium */
            margin: 10px 0;
        }

        
        /* ────────────────[ GLASS BYPASS ]─────────────── */
        :host-context(body.has-glass) .container,
        :host-context(body.has-glass) .api-input,
        :host-context(body.has-glass) .provider-select,
        :host-context(body.has-glass) .action-button,
        :host-context(body.has-glass) .close-button {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            filter: none !important;
            backdrop-filter: none !important;
        }

        :host-context(body.has-glass) .container::after,
        :host-context(body.has-glass) .action-button::after {
            display: none !important;
        }

        :host-context(body.has-glass) .action-button:hover,
        :host-context(body.has-glass) .provider-select:hover,
        :host-context(body.has-glass) .close-button:hover {
            background: transparent !important;
        }
    `

  constructor() {
    super()
    this.dragState = null
    this.wasJustDragged = false
    this.isLoading = false
    this.errorMessage = ""
    //////// after_modelStateService ////////
    this.llmApiKey = "";
    this.sttApiKey = "";
    this.llmProvider = "openai";
    this.sttProvider = "openai";
    this.providers = { llm: [], stt: [] }; // Initialize empty
    //////// after_modelStateService ////////

    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleInput = this.handleInput.bind(this)
    this.handleAnimationEnd = this.handleAnimationEnd.bind(this)
    this.handleUsePicklesKey = this.handleUsePicklesKey.bind(this)
    this.handleLLMProviderChange = this.handleLLMProviderChange.bind(this)
    this.handleSTTProviderChange = this.handleSTTProviderChange.bind(this)
  }

  reset() {
    this.apiKey = ""
    this.isLoading = false
    this.errorMessage = ""
    this.validatedApiKey = null
    this.selectedProvider = "openai"
    this.requestUpdate()
  }

  async loadProviderConfig() {
    if (!window.electronAPI) {
      console.warn('[ApiKeyHeader] ElectronAPI not available, using fallback providers');
      this.providers = {
        llm: [
          { id: 'openai', name: 'OpenAI' },
          { id: 'gemini', name: 'Gemini' },
          { id: 'anthropic', name: 'Anthropic' }
        ],
        stt: [
          { id: 'openai', name: 'OpenAI' },
          { id: 'gemini', name: 'Gemini' }
        ]
      };
      this.requestUpdate();
      return;
    }
    
    try {
      const config = await window.electronAPI.getProviderConfig();
      console.log('[ApiKeyHeader] Loaded provider config:', config);
      
      const llmProviders = [];
      const sttProviders = [];

      for (const id in config) {
          // Skip 'openai-glass' and similar virtual providers from UI display
          if (id.includes('-glass')) continue;

          if (config[id].llmModels && config[id].llmModels.length > 0) {
              llmProviders.push({ id, name: config[id].name });
          }
          if (config[id].sttModels && config[id].sttModels.length > 0) {
              sttProviders.push({ id, name: config[id].name });
          }
      }
      
      this.providers = { llm: llmProviders, stt: sttProviders };
      console.log('[ApiKeyHeader] Processed providers:', this.providers);
      
      // Set default selections if not already set
      if (llmProviders.length > 0 && !this.llmProvider) {
        this.llmProvider = llmProviders[0].id;
      }
      if (sttProviders.length > 0 && !this.sttProvider) {
        this.sttProvider = sttProviders[0].id;
      }
      
      this.requestUpdate();
    } catch (error) {
      console.error('[ApiKeyHeader] Failed to load provider config:', error);
      // Fallback to default providers if loading fails
      this.providers = {
        llm: [
          { id: 'openai', name: 'OpenAI' },
          { id: 'gemini', name: 'Gemini' },
          { id: 'anthropic', name: 'Anthropic' }
        ],
        stt: [
          { id: 'openai', name: 'OpenAI' },
          { id: 'gemini', name: 'Gemini' }
        ]
      };
      this.requestUpdate();
    }
  }

  async handleMouseDown(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON" || e.target.tagName === "SELECT") {
      return
    }

    e.preventDefault()

    if (!window.electronAPI) {
      console.warn('[ApiKeyHeader] ElectronAPI not available for drag operation');
      return;
    }

    const initialPosition = await window.electronAPI.getHeaderPosition()

    this.dragState = {
      initialMouseX: e.screenX,
      initialMouseY: e.screenY,
      initialWindowX: initialPosition.x,
      initialWindowY: initialPosition.y,
      moved: false,
    }

    window.addEventListener("mousemove", this.handleMouseMove)
    window.addEventListener("mouseup", this.handleMouseUp, { once: true })
  }

  handleMouseMove(e) {
    if (!this.dragState) return

    const deltaX = Math.abs(e.screenX - this.dragState.initialMouseX)
    const deltaY = Math.abs(e.screenY - this.dragState.initialMouseY)

    if (deltaX > 3 || deltaY > 3) {
      this.dragState.moved = true
    }

    const newWindowX = this.dragState.initialWindowX + (e.screenX - this.dragState.initialMouseX)
    const newWindowY = this.dragState.initialWindowY + (e.screenY - this.dragState.initialMouseY)

    if (window.electronAPI) {
      window.electronAPI.moveHeaderTo(newWindowX, newWindowY)
    }
  }

  handleMouseUp(e) {
    if (!this.dragState) return

    const wasDragged = this.dragState.moved

    window.removeEventListener("mousemove", this.handleMouseMove)
    this.dragState = null

    if (wasDragged) {
      this.wasJustDragged = true
      setTimeout(() => {
        this.wasJustDragged = false
      }, 200)
    }
  }

  handleInput(e) {
    this.apiKey = e.target.value
    this.errorMessage = ""
    console.log("Input changed:", this.apiKey?.length || 0, "chars")

    this.requestUpdate()
    this.updateComplete.then(() => {
      const inputField = this.shadowRoot?.querySelector(".apikey-input")
      if (inputField && this.isInputFocused) {
        inputField.focus()
      }
    })
  }

  handleLLMProviderChange(e) {
    const newProvider = e.target.value;
    console.log('[ApiKeyHeader] LLM provider changed to:', newProvider);
    this.llmProvider = newProvider;
    this.errorMessage = "";
    this.requestUpdate();
  }

  handleSTTProviderChange(e) {
    const newProvider = e.target.value;
    console.log('[ApiKeyHeader] STT provider changed to:', newProvider);
    this.sttProvider = newProvider;
    this.errorMessage = "";
    this.requestUpdate();
  }

  handlePaste(e) {
    e.preventDefault()
    this.errorMessage = ""
    const clipboardText = (e.clipboardData || window.clipboardData).getData("text")
    console.log("Paste event detected:", clipboardText?.substring(0, 10) + "...")

    if (clipboardText) {
      this.apiKey = clipboardText.trim()

      const inputElement = e.target
      inputElement.value = this.apiKey
    }

    this.requestUpdate()
    this.updateComplete.then(() => {
      const inputField = this.shadowRoot?.querySelector(".apikey-input")
      if (inputField) {
        inputField.focus()
        inputField.setSelectionRange(inputField.value.length, inputField.value.length)
      }
    })
  }

  handleKeyPress(e) {
    if (e.key === "Enter") {
      e.preventDefault()
      this.handleSubmit()
    }
  }

  //////// after_modelStateService ////////
  async handleSubmit() {
    console.log('[ApiKeyHeader] handleSubmit: Submitting API keys...');
    if (this.isLoading || !this.llmApiKey.trim() || !this.sttApiKey.trim()) {
        this.errorMessage = "Please enter keys for both LLM and STT.";
        return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    this.requestUpdate();

    if (!window.electronAPI) {
      console.error('[ApiKeyHeader] ElectronAPI not available for validation');
      this.errorMessage = 'Application initialization error. Please restart the application.';
      this.isLoading = false;
      this.requestUpdate();
      return;
    }

    console.log('[ApiKeyHeader] handleSubmit: Validating keys...');
    console.log('[ApiKeyHeader] LLM Provider:', this.llmProvider, 'Key length:', this.llmApiKey.trim().length);
    console.log('[ApiKeyHeader] STT Provider:', this.sttProvider, 'Key length:', this.sttApiKey.trim().length);
    
    const llmValidation = window.electronAPI.validateApiKey(this.llmProvider, this.llmApiKey.trim());
    const sttValidation = window.electronAPI.validateApiKey(this.sttProvider, this.sttApiKey.trim());
    
    console.log('[ApiKeyHeader] IPC validation requests sent, waiting for responses...');
    const [llmResult, sttResult] = await Promise.all([llmValidation, sttValidation]);
    console.log('[ApiKeyHeader] Validation results received:', { llmResult, sttResult });

    if (llmResult.success && sttResult.success) {
        console.log('[ApiKeyHeader] handleSubmit: Both LLM and STT keys are valid.');
        this.startSlideOutAnimation();
    } else {
        console.log('[ApiKeyHeader] handleSubmit: Validation failed.');
        let errorParts = [];
        if (!llmResult.success) errorParts.push(`LLM Key: ${llmResult.error || 'Invalid'}`);
        if (!sttResult.success) errorParts.push(`STT Key: ${sttResult.error || 'Invalid'}`);
        this.errorMessage = errorParts.join(' | ');
    }

    this.isLoading = false;
    this.requestUpdate();
}
//////// after_modelStateService ////////


  startSlideOutAnimation() {
    console.log('[ApiKeyHeader] startSlideOutAnimation: Starting slide out animation.');
    this.classList.add("sliding-out")
  }

  handleUsePicklesKey(e) {
    e.preventDefault()
    if (this.wasJustDragged) return

    console.log("Requesting Firebase authentication from main process...")
    if (window.electronAPI) {
      window.electronAPI.startFirebaseAuth()
    }
  }

  handleClose() {
    console.log("Close button clicked")
    // Note: quit-application is not currently exposed in electronAPI
    // This functionality may need to be added if needed
    console.warn('[ApiKeyHeader] Close functionality not available via electronAPI')
  }


  //////// after_modelStateService ////////
  handleAnimationEnd(e) {
    if (e.target !== this || !this.classList.contains('sliding-out')) return;
    this.classList.remove("sliding-out");
    this.classList.add("hidden");
    if (window.electronAPI) {
      window.electronAPI.getCurrentUser().then(userState => {
          console.log('[ApiKeyHeader] handleAnimationEnd: User state updated:', userState);
          this.stateUpdateCallback?.(userState);
      });
    }
  }
//////// after_modelStateService ////////

  async requestWindowExpand() {
    if (window.electronAPI) {
      try {
        await window.electronAPI.resizeHeaderWindow(390, 320);
        console.log('[ApiKeyHeader] Window resized for API key entry');
      } catch (error) {
        console.warn('[ApiKeyHeader] Failed to resize window:', error.message);
      }
    }
  }

  connectedCallback() {
    super.connectedCallback()
    this.addEventListener("animationend", this.handleAnimationEnd)
    
    // Load provider configurations first
    this.loadProviderConfig();
    
    // Request window resize on mount to ensure proper sizing for API key UI
    this.requestWindowExpand();
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.removeEventListener("animationend", this.handleAnimationEnd)
  }

  render() {
    const isButtonDisabled = this.isLoading || !this.llmApiKey.trim() || !this.sttApiKey.trim();

    return html`
        <div class="container" @mousedown=${this.handleMouseDown}>
            <h1 class="title">Enter Your API Keys</h1>

            <div class="providers-container">
                <div class="provider-column">
                    <div class="provider-label"></div>
                    <select class="provider-select" .value=${this.llmProvider} @change=${this.handleLLMProviderChange} ?disabled=${this.isLoading}>
                        ${this.providers.llm && this.providers.llm.length > 0 
                          ? this.providers.llm.map(p => html`<option value=${p.id}>${p.name}</option>`)
                          : html`<option value="openai">Loading...</option>`
                        }
                    </select>
                    <input type="password" class="api-input" placeholder="LLM Provider API Key" .value=${this.llmApiKey} @input=${e => this.llmApiKey = e.target.value} ?disabled=${this.isLoading}>
                </div>

                <div class="provider-column">
                    <div class="provider-label"></div>
                    <select class="provider-select" .value=${this.sttProvider} @change=${this.handleSTTProviderChange} ?disabled=${this.isLoading}>
                        ${this.providers.stt && this.providers.stt.length > 0 
                          ? this.providers.stt.map(p => html`<option value=${p.id}>${p.name}</option>`)
                          : html`<option value="openai">Loading...</option>`
                        }
                    </select>
                    <input type="password" class="api-input" placeholder="STT Provider API Key" .value=${this.sttApiKey} @input=${e => this.sttApiKey = e.target.value} ?disabled=${this.isLoading}>
                </div>
            </div>
            
            <div class="error-message">${this.errorMessage}</div>

            <button class="action-button" @click=${this.handleSubmit} ?disabled=${isButtonDisabled}>
                ${this.isLoading ? "Validating..." : "Confirm"}
            </button>
            <div class="or-text">or</div>
            <button class="action-button" @click=${this.handleUsePicklesKey}>Use Pickle's Key (Login)</button>
        </div>
    `;
}
}

customElements.define("apikey-header", ApiKeyHeader)
