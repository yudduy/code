/**
 * PromptListener - Detects when users submit prompts to AI tools
 * Supports ChatGPT, Claude, Cursor, and other AI interfaces
 */

class PromptListener {
  constructor() {
    this.isListening = false;
    this.currentSessionId = null;
    this.eventQueue = [];
    this.observers = [];
    this.keyListeners = [];
    this.consentGiven = false;
    this.capturePromptText = false; // Default: only detect submissions, don't capture text
    
    // Word counter functionality
    this.currentWordCount = 0;
    this.wordCountCallbacks = [];
    this.activePromptElement = null;
    this.inputTimer = null;
    
    // Bind methods
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleMutation = this.handleMutation.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
  }

  /**
   * Start listening for prompt submissions
   * @param {string} sessionId - Current session ID
   * @param {Object} options - Configuration options
   * @param {boolean} options.captureText - Whether to capture prompt text (requires consent)
   */
  start(sessionId, options = {}) {
    this.currentSessionId = sessionId;
    this.capturePromptText = options.captureText && this.consentGiven;
    this.isListening = true;
    
    console.log('PromptListener started for session:', sessionId);
    
    // Add keyboard event listeners
    this.addKeyboardListeners();
    
    // Add input listeners for word counting
    this.addInputListeners();
    
    // Add DOM mutation observers for dynamic content
    this.addMutationObservers();
  }

  /**
   * Stop listening for prompt submissions
   */
  stop() {
    this.isListening = false;
    this.currentSessionId = null;
    
    // Remove keyboard listeners
    this.removeKeyboardListeners();
    
    // Remove input listeners
    this.removeInputListeners();
    
    // Disconnect mutation observers
    this.removeMutationObservers();
    
    // Reset word count
    this.resetWordCount();
    
    console.log('PromptListener stopped');
  }

  /**
   * Set user consent for prompt text capture
   * @param {boolean} consent - Whether user consents to text capture
   */
  setConsent(consent) {
    this.consentGiven = consent;
    console.log('Prompt text capture consent:', consent);
  }

  /**
   * Get current event queue and clear it
   * @returns {Array} Array of prompt submission events
   */
  getEvents() {
    const events = [...this.eventQueue];
    this.eventQueue = [];
    return events;
  }

  /**
   * Add keyboard event listeners
   */
  addKeyboardListeners() {
    // Listen for common prompt submission shortcuts
    document.addEventListener('keydown', this.handleKeydown, true);
  }

  /**
   * Remove keyboard event listeners
   */
  removeKeyboardListeners() {
    document.removeEventListener('keydown', this.handleKeydown, true);
  }

  /**
   * Add input event listeners for word counting
   */
  addInputListeners() {
    document.addEventListener('input', this.handleInput, true);
    document.addEventListener('focus', this.handleFocus, true);
    document.addEventListener('blur', this.handleBlur, true);
  }

  /**
   * Remove input event listeners
   */
  removeInputListeners() {
    document.removeEventListener('input', this.handleInput, true);
    document.removeEventListener('focus', this.handleFocus, true);
    document.removeEventListener('blur', this.handleBlur, true);
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeydown(event) {
    if (!this.isListening) return;

    const isPromptSubmission = this.detectPromptSubmission(event);
    
    if (isPromptSubmission) {
      const appId = this.getCurrentAppId();
      const promptText = this.capturePromptText ? this.extractPromptText() : null;
      
      this.recordPromptEvent(appId, promptText);
      
      // Reset word count after prompt submission
      this.resetWordCount();
    }
  }

  /**
   * Handle input events for word counting
   * @param {InputEvent} event - Input event
   */
  handleInput(event) {
    if (!this.isListening) return;
    
    const target = event.target;
    if (this.isPromptInput(target)) {
      // Debounce word counting to avoid excessive updates
      if (this.inputTimer) {
        clearTimeout(this.inputTimer);
      }
      
      this.inputTimer = setTimeout(() => {
        this.updateWordCount(target);
      }, 100);
    }
  }

  /**
   * Handle focus events
   * @param {FocusEvent} event - Focus event
   */
  handleFocus(event) {
    if (!this.isListening) return;
    
    const target = event.target;
    if (this.isPromptInput(target)) {
      this.activePromptElement = target;
      this.updateWordCount(target);
    }
  }

  /**
   * Handle blur events
   * @param {FocusEvent} event - Blur event
   */
  handleBlur(event) {
    if (!this.isListening) return;
    
    const target = event.target;
    if (target === this.activePromptElement) {
      this.activePromptElement = null;
      this.resetWordCount();
    }
  }

  /**
   * Detect if a keyboard event represents a prompt submission
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {boolean} Whether this is a prompt submission
   */
  detectPromptSubmission(event) {
    const { key, ctrlKey, metaKey, shiftKey } = event;
    
    // Ctrl+Enter or Cmd+Enter (common in ChatGPT, Claude web)
    if ((ctrlKey || metaKey) && key === 'Enter' && !shiftKey) {
      return this.isInPromptContext();
    }
    
    // Plain Enter in specific contexts (Cursor, some AI tools)
    if (key === 'Enter' && !ctrlKey && !metaKey && !shiftKey) {
      return this.isInCursorPromptContext() || this.isInChatInterface();
    }
    
    return false;
  }

  /**
   * Check if we're in a prompt context (text area, input field for AI)
   * @returns {boolean} Whether we're in a prompt context
   */
  isInPromptContext() {
    const activeElement = document.activeElement;
    if (!activeElement) return false;
    
    // Check for ChatGPT
    if (this.isChatGPTPromptArea(activeElement)) return true;
    
    // Check for Claude
    if (this.isClaudePromptArea(activeElement)) return true;
    
    // Check for general AI chat interfaces
    if (this.isGenericAIChatArea(activeElement)) return true;
    
    return false;
  }

  /**
   * Check if we're in Cursor prompt context
   * @returns {boolean} Whether we're in Cursor prompt context
   */
  isInCursorPromptContext() {
    const activeElement = document.activeElement;
    if (!activeElement) return false;
    
    // Cursor AI chat panel patterns
    const cursorSelectors = [
      '[data-testid="chat-input"]',
      '.cursor-chat-input',
      '[placeholder*="ask cursor"]',
      '[placeholder*="Ask Cursor"]'
    ];
    
    return cursorSelectors.some(selector => 
      activeElement.matches(selector) || activeElement.closest(selector)
    );
  }

  /**
   * Check if we're in a chat interface
   * @returns {boolean} Whether we're in a chat interface
   */
  isInChatInterface() {
    const activeElement = document.activeElement;
    if (!activeElement) return false;
    
    const tagName = activeElement.tagName.toLowerCase();
    if (tagName !== 'textarea' && tagName !== 'input') return false;
    
    // Look for chat-related attributes or classes
    const chatIndicators = [
      'chat', 'message', 'prompt', 'input', 'send',
      'conversation', 'ai', 'assistant', 'bot'
    ];
    
    const elementText = (
      activeElement.className + ' ' +
      activeElement.id + ' ' +
      (activeElement.placeholder || '') + ' ' +
      (activeElement.getAttribute('aria-label') || '')
    ).toLowerCase();
    
    return chatIndicators.some(indicator => elementText.includes(indicator));
  }

  /**
   * Check if element is ChatGPT prompt area
   * @param {Element} element - DOM element
   * @returns {boolean} Whether element is ChatGPT prompt area
   */
  isChatGPTPromptArea(element) {
    const selectors = [
      '[data-testid="prompt-textarea"]',
      '#prompt-textarea',
      '.ProseMirror',
      '[placeholder*="Message ChatGPT"]'
    ];
    
    return selectors.some(selector => 
      element.matches(selector) || element.closest(selector)
    );
  }

  /**
   * Check if element is Claude prompt area
   * @param {Element} element - DOM element
   * @returns {boolean} Whether element is Claude prompt area
   */
  isClaudePromptArea(element) {
    const selectors = [
      '[data-testid="chat-input"]',
      '.ProseMirror',
      '[placeholder*="Talk with Claude"]',
      '[placeholder*="Message Claude"]'
    ];
    
    return selectors.some(selector => 
      element.matches(selector) || element.closest(selector)
    );
  }

  /**
   * Check if element is generic AI chat area
   * @param {Element} element - DOM element
   * @returns {boolean} Whether element is generic AI chat area
   */
  isGenericAIChatArea(element) {
    const tagName = element.tagName.toLowerCase();
    if (tagName !== 'textarea' && tagName !== 'input') return false;
    
    // Check for AI-related selectors
    const aiSelectors = [
      '[data-role="chat-input"]',
      '[data-testid*="prompt"]',
      '[data-testid*="chat"]',
      '.ai-input',
      '.chat-input',
      '.prompt-input'
    ];
    
    return aiSelectors.some(selector => 
      element.matches(selector) || element.closest(selector)
    );
  }

  /**
   * Extract prompt text from current context
   * @returns {string|null} Prompt text or null if not available/consented
   */
  extractPromptText() {
    if (!this.capturePromptText || !this.consentGiven) return null;
    
    const activeElement = document.activeElement;
    if (!activeElement) return null;
    
    const text = activeElement.value || activeElement.textContent || '';
    return text.trim() || null;
  }

  /**
   * Get current application ID
   * @returns {string} Current app ID
   */
  getCurrentAppId() {
    const hostname = window.location?.hostname || '';
    
    if (hostname.includes('chat.openai.com')) return 'chatgpt';
    if (hostname.includes('claude.ai')) return 'claude';
    if (hostname.includes('cursor')) return 'cursor';
    
    return 'unknown';
  }

  /**
   * Record a prompt submission event
   * @param {string} appId - Application ID
   * @param {string|null} promptText - Prompt text (if consented)
   */
  recordPromptEvent(appId, promptText = null) {
    const event = {
      sessionId: this.currentSessionId,
      ts: Date.now(),
      type: 'PROMPT_SUBMIT',
      appId: appId,
      prompt: promptText
    };
    
    this.eventQueue.push(event);
    console.log('Prompt submission detected:', event);
  }

  /**
   * Add DOM mutation observers
   */
  addMutationObservers() {
    // Observer for dynamically added chat interfaces
    const observer = new MutationObserver(this.handleMutation);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-testid', 'placeholder']
    });
    
    this.observers.push(observer);
  }

  /**
   * Remove DOM mutation observers
   */
  removeMutationObservers() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Handle DOM mutations
   * @param {MutationRecord[]} mutations - Array of mutations
   */
  handleMutation(mutations) {
    // Currently just monitoring - could be extended to detect
    // new chat interfaces being added dynamically
  }

  /**
   * Check if an element is a prompt input field
   * @param {Element} element - DOM element to check
   * @returns {boolean} Whether element is a prompt input
   */
  isPromptInput(element) {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    if (tagName !== 'textarea' && tagName !== 'input') return false;
    
    // Use existing detection methods
    return this.isChatGPTPromptArea(element) || 
           this.isClaudePromptArea(element) || 
           this.isGenericAIChatArea(element) ||
           this.isInCursorPromptContext();
  }

  /**
   * Count words in text
   * @param {string} text - Text to count words in
   * @returns {number} Word count
   */
  countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    
    // Remove extra whitespace and split by whitespace
    const words = text.trim().split(/\s+/);
    
    // Filter out empty strings
    return words.filter(word => word.length > 0).length;
  }

  /**
   * Update word count for the given element
   * @param {Element} element - Input element to count words from
   */
  updateWordCount(element) {
    if (!element) return;
    
    const text = element.value || element.textContent || '';
    const wordCount = this.countWords(text);
    
    if (wordCount !== this.currentWordCount) {
      this.currentWordCount = wordCount;
      this.notifyWordCountChange(wordCount);
    }
  }

  /**
   * Reset word count to zero
   */
  resetWordCount() {
    if (this.currentWordCount !== 0) {
      this.currentWordCount = 0;
      this.notifyWordCountChange(0);
    }
  }

  /**
   * Add callback for word count changes
   * @param {Function} callback - Callback function that receives word count
   */
  onWordCountChange(callback) {
    if (typeof callback === 'function') {
      this.wordCountCallbacks.push(callback);
    }
  }

  /**
   * Remove word count change callback
   * @param {Function} callback - Callback function to remove
   */
  removeWordCountCallback(callback) {
    const index = this.wordCountCallbacks.indexOf(callback);
    if (index > -1) {
      this.wordCountCallbacks.splice(index, 1);
    }
  }

  /**
   * Notify all callbacks of word count change
   * @param {number} wordCount - New word count
   */
  notifyWordCountChange(wordCount) {
    this.wordCountCallbacks.forEach(callback => {
      try {
        callback(wordCount);
      } catch (error) {
        console.error('Error in word count callback:', error);
      }
    });
  }

  /**
   * Get current word count
   * @returns {number} Current word count
   */
  getCurrentWordCount() {
    return this.currentWordCount;
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.PromptListener = PromptListener;
}

module.exports = PromptListener;