// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

console.log('[Preload] Loading preload script...');

const { contextBridge, ipcRenderer, shell } = require('electron');

console.log('[Preload] Modules imported successfully:', {
  contextBridge: !!contextBridge,
  ipcRenderer: !!ipcRenderer,
  shell: !!shell
});

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Listen for focus change events from the main process
   * @param {Function} callback - Function to call when focus changes
   */
  onFocusChange: (callback) => {
    // Remove any existing listeners to prevent duplicates
    ipcRenderer.removeAllListeners('APP_FOCUS_CHANGED');
    
    // Add the new listener
    ipcRenderer.on('APP_FOCUS_CHANGED', callback);
  },

  /**
   * Remove focus change listeners
   */
  removeFocusChangeListener: () => {
    ipcRenderer.removeAllListeners('APP_FOCUS_CHANGED');
  },

  /**
   * Request current focus state from main process
   * @returns {Promise} Promise that resolves with current focus state
   */
  getCurrentFocusState: () => {
    return ipcRenderer.invoke('focus:getState');
  },

  // API Key validation methods
  /**
   * Validate an API key for a specific provider
   * @param {string} provider - The provider name (openai, gemini, anthropic)
   * @param {string} key - The API key to validate
   * @returns {Promise} Promise that resolves with validation result
   */
  validateApiKey: (provider, key) => {
    return ipcRenderer.invoke('model:validate-key', { provider, key });
  },

  /**
   * Get provider configuration
   * @returns {Promise} Promise that resolves with provider config
   */
  getProviderConfig: () => {
    return ipcRenderer.invoke('model:get-provider-config');
  },

  // Window management methods
  /**
   * Resize the header window
   * @param {number} width - New width
   * @param {number} height - New height
   * @returns {Promise} Promise that resolves when resize is complete
   */
  resizeHeaderWindow: (width, height) => {
    return ipcRenderer.invoke('resize-header-window', { width, height });
  },

  /**
   * Get current header position
   * @returns {Promise} Promise that resolves with header position
   */
  getHeaderPosition: () => {
    return ipcRenderer.invoke('get-header-position');
  },

  /**
   * Move header to specific position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Promise} Promise that resolves when move is complete
   */
  moveHeaderTo: (x, y) => {
    return ipcRenderer.invoke('move-header-to', x, y);
  },

  // Firebase authentication
  /**
   * Start Firebase authentication
   * @returns {Promise} Promise that resolves when auth starts
   */
  startFirebaseAuth: () => {
    return ipcRenderer.invoke('start-firebase-auth');
  },

  // Event listeners
  /**
   * Listen for authentication events
   * @param {Function} callback - Function to call when auth events occur
   */
  onAuthFailed: (callback) => {
    ipcRenderer.removeAllListeners('auth-failed');
    ipcRenderer.on('auth-failed', callback);
  },

  /**
   * Remove authentication event listeners
   */
  removeAuthListeners: () => {
    ipcRenderer.removeAllListeners('auth-failed');
  },

  /**
   * Get current user information
   * @returns {Promise} Promise that resolves with current user data
   */
  getCurrentUser: () => {
    return ipcRenderer.invoke('get-current-user');
  },

  // Header state management
  /**
   * Check if providers are configured
   * @returns {Promise} Promise that resolves with configuration status
   */
  areProvidersConfigured: () => {
    return ipcRenderer.invoke('model:are-providers-configured');
  },

  /**
   * Check permissions status
   * @returns {Promise} Promise that resolves with permission status
   */
  checkPermissions: () => {
    return ipcRenderer.invoke('check-system-permissions');
  },

  /**
   * Check if permissions were completed
   * @returns {Promise} Promise that resolves with completion status
   */
  checkPermissionsCompleted: () => {
    return ipcRenderer.invoke('check-permissions-completed');
  },

  /**
   * Send header state change notification
   * @param {string} state - The new header state
   */
  sendHeaderStateChanged: (state) => {
    ipcRenderer.send('header-state-changed', state);
  },

  // Event listeners for header controller
  /**
   * Listen for user state changes
   * @param {Function} callback - Function to call when user state changes
   */
  onUserStateChanged: (callback) => {
    ipcRenderer.removeAllListeners('user-state-changed');
    ipcRenderer.on('user-state-changed', callback);
  },

  /**
   * Listen for auth failed events
   * @param {Function} callback - Function to call when auth fails
   */
  onAuthFailedEvent: (callback) => {
    ipcRenderer.removeAllListeners('auth-failed');
    ipcRenderer.on('auth-failed', callback);
  },

  /**
   * Listen for force show API key header events
   * @param {Function} callback - Function to call when forced to show API key header
   */
  onForceShowApiKeyHeader: (callback) => {
    ipcRenderer.removeAllListeners('force-show-apikey-header');
    ipcRenderer.on('force-show-apikey-header', callback);
  },

  /**
   * Remove all header event listeners
   */
  removeAllHeaderListeners: () => {
    ipcRenderer.removeAllListeners('user-state-changed');
    ipcRenderer.removeAllListeners('auth-failed');
    ipcRenderer.removeAllListeners('force-show-apikey-header');
  },

  // Navigation methods for MainHeader
  /**
   * Toggle a feature window (ask, listen)
   * @param {string} feature - The feature to toggle
   * @returns {Promise} Promise that resolves when toggle is complete
   */
  toggleFeature: (feature) => {
    return ipcRenderer.invoke('toggle-feature', feature);
  },

  /**
   * Close active session
   * @returns {Promise} Promise that resolves when session is closed
   */
  closeSession: () => {
    return ipcRenderer.invoke('close-session');
  },

  /**
   * Toggle all windows visibility
   * @returns {Promise} Promise that resolves when visibility is toggled
   */
  toggleAllWindowsVisibility: () => {
    return ipcRenderer.invoke('toggle-all-windows-visibility');
  },

  /**
   * Show a window
   * @param {string|Object} nameOrOptions - Window name or options object
   * @returns {Promise} Promise that resolves when window is shown
   */
  showWindow: (nameOrOptions) => {
    return ipcRenderer.send('show-window', nameOrOptions);
  },

  /**
   * Hide a window
   * @param {string} name - Window name to hide
   * @returns {Promise} Promise that resolves when window is hidden
   */
  hideWindow: (name) => {
    return ipcRenderer.send('hide-window', name);
  },

  /**
   * Cancel hide window operation
   * @param {string} name - Window name to cancel hide for
   * @returns {Promise} Promise that resolves when hide is cancelled
   */
  cancelHideWindow: (name) => {
    return ipcRenderer.send('cancel-hide-window', name);
  },

  /**
   * Get application signatures for focused app display
   * @returns {Promise} Promise that resolves with app signatures object
   */
  getAppSignatures: () => {
    return ipcRenderer.invoke('get-app-signatures');
  },

  // Ask View IPC methods
  /**
   * Listen for ask global send events
   * @param {Function} callback - Function to call when global send is triggered
   */
  onAskGlobalSend: (callback) => {
    ipcRenderer.removeAllListeners('ask-global-send');
    ipcRenderer.on('ask-global-send', callback);
  },

  /**
   * Listen for toggle text input events
   * @param {Function} callback - Function to call when text input should be toggled
   */
  onToggleTextInput: (callback) => {
    ipcRenderer.removeAllListeners('toggle-text-input');
    ipcRenderer.on('toggle-text-input', callback);
  },

  /**
   * Listen for question from assistant events
   * @param {Function} callback - Function to call when assistant sends a question
   */
  onQuestionFromAssistant: (callback) => {
    ipcRenderer.removeAllListeners('receive-question-from-assistant');
    ipcRenderer.on('receive-question-from-assistant', callback);
  },

  /**
   * Listen for hide text input events
   * @param {Function} callback - Function to call when text input should be hidden
   */
  onHideTextInput: (callback) => {
    ipcRenderer.removeAllListeners('hide-text-input');
    ipcRenderer.on('hide-text-input', callback);
  },

  /**
   * Listen for clear ask response events
   * @param {Function} callback - Function to call when response should be cleared
   */
  onClearAskResponse: (callback) => {
    ipcRenderer.removeAllListeners('clear-ask-response');
    ipcRenderer.on('clear-ask-response', callback);
  },

  /**
   * Listen for ask response chunk events
   * @param {Function} callback - Function to call when response chunk is received
   */
  onAskResponseChunk: (callback) => {
    ipcRenderer.removeAllListeners('ask-response-chunk');
    ipcRenderer.on('ask-response-chunk', callback);
  },

  /**
   * Listen for ask response stream end events
   * @param {Function} callback - Function to call when response stream ends
   */
  onAskResponseStreamEnd: (callback) => {
    ipcRenderer.removeAllListeners('ask-response-stream-end');
    ipcRenderer.on('ask-response-stream-end', callback);
  },

  /**
   * Listen for window blur events
   * @param {Function} callback - Function to call when window loses focus
   */
  onWindowBlur: (callback) => {
    ipcRenderer.removeAllListeners('window-blur');
    ipcRenderer.on('window-blur', callback);
  },

  /**
   * Listen for window hide animation events
   * @param {Function} callback - Function to call when window hide animation should start
   */
  onWindowHideAnimation: (callback) => {
    ipcRenderer.removeAllListeners('window-hide-animation');
    ipcRenderer.on('window-hide-animation', callback);
  },

  /**
   * Remove all Ask View event listeners
   */
  removeAllAskListeners: () => {
    ipcRenderer.removeAllListeners('ask-global-send');
    ipcRenderer.removeAllListeners('toggle-text-input');
    ipcRenderer.removeAllListeners('receive-question-from-assistant');
    ipcRenderer.removeAllListeners('hide-text-input');
    ipcRenderer.removeAllListeners('clear-ask-response');
    ipcRenderer.removeAllListeners('ask-response-chunk');
    ipcRenderer.removeAllListeners('ask-response-stream-end');
    ipcRenderer.removeAllListeners('window-blur');
    ipcRenderer.removeAllListeners('window-hide-animation');
  },

  // Additional Ask View IPC methods
  /**
   * Close ask window if empty
   * @returns {Promise} Promise that resolves when window is closed
   */
  closeAskWindowIfEmpty: () => {
    return ipcRenderer.invoke('close-ask-window-if-empty');
  },

  /**
   * Force close a window
   * @param {string} windowName - Name of window to close
   * @returns {Promise} Promise that resolves when window is closed
   */
  forceCloseWindow: (windowName) => {
    return ipcRenderer.invoke('force-close-window', windowName);
  },

  /**
   * Adjust window height
   * @param {number} targetHeight - Target height in pixels
   * @returns {Promise} Promise that resolves when height is adjusted
   */
  adjustWindowHeight: (targetHeight) => {
    return ipcRenderer.invoke('adjust-window-height', targetHeight);
  },

  /**
   * Send message to Ask service
   * @param {string} message - Message to send
   * @returns {Promise} Promise that resolves when message is sent
   */
  sendAskMessage: (message) => {
    return ipcRenderer.invoke('ask:sendMessage', message);
  },

  // Assessment-specific IPC methods
  /**
   * Quit the application
   * @returns {Promise} Promise that resolves when quit is initiated
   */
  quitApplication: () => {
    return ipcRenderer.invoke('quit-application');
  },

  /**
   * Collapse window to header only
   * @returns {Promise} Promise that resolves with collapse result
   */
  collapseToHeader: () => {
    return ipcRenderer.invoke('collapse-to-header');
  },

  // Multi-window assessment flow IPC methods
  /**
   * Handle consent accepted
   * @returns {Promise} Promise that resolves when transition is initiated
   */
  consentAccepted: () => {
    return ipcRenderer.invoke('consent-accepted');
  },

  /**
   * Handle consent declined
   * @returns {Promise} Promise that resolves when quit is initiated
   */
  consentDeclined: () => {
    return ipcRenderer.invoke('consent-declined');
  },

  /**
   * Start assessment and transition to header window
   * @returns {Promise} Promise that resolves when assessment starts
   */
  startAssessment: () => {
    return ipcRenderer.invoke('start-assessment');
  },

  /**
   * Stop assessment and transition to completion window
   * @returns {Promise} Promise that resolves when assessment stops
   */
  stopAssessment: () => {
    return ipcRenderer.invoke('stop-assessment');
  },

  /**
   * Listen for timer updates during assessment
   * @param {Function} callback - Function to call when timer updates
   */
  onUpdateTimer: (callback) => {
    ipcRenderer.removeAllListeners('update-timer');
    ipcRenderer.on('update-timer', callback);
  },

  /**
   * Listen for word count updates during assessment
   * @param {Function} callback - Function to call when word count updates
   */
  onUpdateWordCount: (callback) => {
    ipcRenderer.removeAllListeners('update-word-count');
    ipcRenderer.on('update-word-count', callback);
  },

  // Shell operations
  /**
   * Open external URL in default browser
   * @param {string} url - URL to open
   * @returns {Promise} Promise that resolves when URL is opened
   */
  openExternal: (url) => {
    console.log('[Preload] openExternal called with URL:', url);
    console.log('[Preload] shell.openExternal available:', !!shell.openExternal);
    return shell.openExternal(url);
  },

  // Platform detection
  /**
   * Get the current platform
   * @returns {string} Platform string (win32, darwin, linux, etc.)
   */
  getPlatform: () => {
    return process.platform;
  },

  // Audio and telemetry methods for assessment mode
  /**
   * Send audio content to main process
   * @param {Object} audioData - Audio data object
   * @returns {Promise} Promise that resolves when audio is sent
   */
  sendAudioContent: (audioData) => {
    return ipcRenderer.invoke('send-audio-content', audioData);
  },

  /**
   * Send system audio content to main process
   * @param {Object} audioData - System audio data object
   * @returns {Promise} Promise that resolves when audio is sent
   */
  sendSystemAudioContent: (audioData) => {
    return ipcRenderer.invoke('send-system-audio-content', audioData);
  },

  /**
   * Capture screenshot
   * @param {Object} options - Screenshot options
   * @returns {Promise} Promise that resolves with screenshot data
   */
  captureScreenshot: (options) => {
    return ipcRenderer.invoke('capture-screenshot', options);
  },

  /**
   * Get current screenshot
   * @returns {Promise} Promise that resolves with current screenshot
   */
  getCurrentScreenshot: () => {
    return ipcRenderer.invoke('get-current-screenshot');
  },

  /**
   * Start macOS audio capture
   * @returns {Promise} Promise that resolves with start result
   */
  startMacOSAudio: () => {
    return ipcRenderer.invoke('start-macos-audio');
  },

  /**
   * Stop macOS audio capture
   * @returns {Promise} Promise that resolves when stopped
   */
  stopMacOSAudio: () => {
    return ipcRenderer.invoke('stop-macos-audio');
  },

  /**
   * Start screen capture
   * @returns {Promise} Promise that resolves with start result
   */
  startScreenCapture: () => {
    return ipcRenderer.invoke('start-screen-capture');
  },

  /**
   * Stop screen capture
   * @returns {Promise} Promise that resolves when stopped
   */
  stopScreenCapture: () => {
    return ipcRenderer.invoke('stop-screen-capture');
  },

  /**
   * Check if session is active
   * @returns {Promise} Promise that resolves with session status
   */
  isSessionActive: () => {
    return ipcRenderer.invoke('is-session-active');
  },

  /**
   * Start focus detector for telemetry
   * @param {string} sessionId - Session ID for tracking
   * @returns {Promise} Promise that resolves when started
   */
  startFocusDetector: (sessionId) => {
    return ipcRenderer.invoke('focus:start', sessionId);
  },

  /**
   * Stop focus detector
   * @returns {Promise} Promise that resolves when stopped
   */
  stopFocusDetector: () => {
    return ipcRenderer.invoke('focus:stop');
  },

  /**
   * Listen for system audio data events
   * @param {Function} callback - Function to call when system audio data is received
   */
  onSystemAudioData: (callback) => {
    ipcRenderer.removeAllListeners('system-audio-data');
    ipcRenderer.on('system-audio-data', callback);
  }
});

console.log('[Preload] electronAPI exposed to main world with all methods including openExternal');
