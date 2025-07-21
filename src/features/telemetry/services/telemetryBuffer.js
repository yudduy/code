/**
 * TelemetryBuffer - Handles batching, queuing, and retry logic for telemetry events
 * Ensures reliable delivery of focus and prompt events to the Supabase backend
 */

const supabaseClient = require('../../../core/services/supabaseClient');

class TelemetryBuffer {
  constructor(options = {}) {
    this.events = [];
    this.failedEvents = [];
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
    this.isUploading = false;
    this.sessionId = options.sessionId || null;
    
    // Configuration
    this.config = {
      batchSize: options.batchSize || 10,
      maxBatchWaitTime: options.maxBatchWaitTime || 5000, // 5 seconds
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000, // 1 second
      maxQueueSize: options.maxQueueSize || 1000,
      endpoint: options.endpoint || '/ingest' // Legacy, now uses Supabase
    };
    
    // Timers
    this.batchTimer = null;
    this.retryTimer = null;
    
    // Bind methods
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
    
    // Set up network status listeners
    this.setupNetworkListeners();
    
    // Initialize Supabase client
    if (typeof window === 'undefined') {
      // Node.js environment (main process)
      supabaseClient.initialize();
    }
    
    console.log('TelemetryBuffer initialized with config:', this.config);
  }

  /**
   * Set the session ID for this telemetry buffer
   * @param {string} sessionId - Session ID for the current assessment
   */
  setSessionId(sessionId) {
    this.sessionId = sessionId;
    console.log('TelemetryBuffer session ID set to:', sessionId);
  }

  /**
   * Add an event to the buffer
   * @param {Object} event - Telemetry event to add
   */
  addEvent(event) {
    // Validate event structure
    if (!this.isValidEvent(event)) {
      console.warn('Invalid telemetry event:', event);
      return false;
    }
    
    // Check queue size limit
    if (this.events.length >= this.config.maxQueueSize) {
      console.warn('Telemetry queue full, dropping oldest event');
      this.events.shift();
    }
    
    // Add timestamp if not present
    if (!event.ts) {
      event.ts = Date.now();
    }
    
    this.events.push(event);
    console.log('Event added to telemetry buffer:', event);
    
    // Trigger batch processing
    this.scheduleBatchUpload();
    
    return true;
  }

  /**
   * Add multiple events at once
   * @param {Array} events - Array of telemetry events
   */
  addEvents(events) {
    if (!Array.isArray(events)) {
      console.warn('addEvents expects an array');
      return false;
    }
    
    const addedCount = events.filter(event => this.addEvent(event)).length;
    console.log(`Added ${addedCount}/${events.length} events to buffer`);
    
    return addedCount === events.length;
  }

  /**
   * Schedule a batch upload
   */
  scheduleBatchUpload() {
    // Clear existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    // If we have enough events for a batch, upload immediately
    if (this.events.length >= this.config.batchSize) {
      this.processBatch();
      return;
    }
    
    // Otherwise, schedule upload after max wait time
    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.config.maxBatchWaitTime);
  }

  /**
   * Process current batch of events
   */
  async processBatch() {
    if (this.isUploading || this.events.length === 0 || !this.isOnline) {
      return;
    }
    
    // Clear batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Extract batch
    const batchSize = Math.min(this.events.length, this.config.batchSize);
    const batch = this.events.splice(0, batchSize);
    
    console.log(`Processing batch of ${batch.length} events`);
    
    try {
      await this.uploadBatch(batch);
      console.log(`Successfully uploaded batch of ${batch.length} events`);
    } catch (error) {
      console.error('Failed to upload batch:', error);
      this.handleFailedBatch(batch, error);
    }
  }

  /**
   * Upload a batch of events to Supabase
   * @param {Array} batch - Array of events to upload
   */
  async uploadBatch(batch) {
    this.isUploading = true;
    
    try {
      if (!this.sessionId) {
        console.warn('[TelemetryBuffer] No session ID set, skipping upload');
        return { success: true, message: 'No session ID set, skipping upload' };
      }

      // Use Supabase client for upload
      const result = await supabaseClient.sendTelemetryEvents(batch, this.sessionId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to upload telemetry events');
      }
      
      return result.data;
      
    } finally {
      this.isUploading = false;
    }
  }

  /**
   * Handle failed batch upload
   * @param {Array} batch - Failed batch
   * @param {Error} error - Error that occurred
   */
  handleFailedBatch(batch, error) {
    // Add retry metadata to events
    const eventsWithRetry = batch.map(event => ({
      ...event,
      _retryCount: (event._retryCount || 0) + 1,
      _lastError: error.message
    }));
    
    // Filter out events that have exceeded max retries
    const retryableEvents = eventsWithRetry.filter(event => 
      event._retryCount <= this.config.maxRetries
    );
    
    const droppedCount = eventsWithRetry.length - retryableEvents.length;
    if (droppedCount > 0) {
      console.warn(`Dropping ${droppedCount} events after max retries`);
    }
    
    // Add retryable events back to failed queue
    this.failedEvents.push(...retryableEvents);
    
    // Schedule retry
    this.scheduleRetry();
  }

  /**
   * Schedule retry for failed events
   */
  scheduleRetry() {
    if (this.retryTimer || this.failedEvents.length === 0) {
      return;
    }
    
    const delay = this.config.retryDelay * Math.pow(2, 
      Math.min(this.failedEvents[0]?._retryCount || 1, 5) // Exponential backoff
    );
    
    console.log(`Scheduling retry in ${delay}ms for ${this.failedEvents.length} failed events`);
    
    this.retryTimer = setTimeout(() => {
      this.retryFailedEvents();
    }, delay);
  }

  /**
   * Retry failed events
   */
  async retryFailedEvents() {
    this.retryTimer = null;
    
    if (this.failedEvents.length === 0 || !this.isOnline) {
      return;
    }
    
    // Move failed events back to main queue
    const retryBatch = this.failedEvents.splice(0, this.config.batchSize);
    this.events.unshift(...retryBatch);
    
    console.log(`Retrying ${retryBatch.length} failed events`);
    
    // Process the batch
    await this.processBatch();
    
    // Schedule next retry if there are still failed events
    if (this.failedEvents.length > 0) {
      this.scheduleRetry();
    }
  }

  /**
   * Force upload all pending events
   */
  async flush() {
    console.log('Flushing telemetry buffer...');
    
    // Process all pending events
    while (this.events.length > 0 && this.isOnline) {
      await this.processBatch();
    }
    
    // Retry failed events
    if (this.failedEvents.length > 0 && this.isOnline) {
      await this.retryFailedEvents();
    }
    
    console.log('Telemetry buffer flush complete');
  }

  /**
   * Get current buffer statistics
   * @returns {Object} Buffer statistics
   */
  getStats() {
    return {
      pendingEvents: this.events.length,
      failedEvents: this.failedEvents.length,
      isOnline: this.isOnline,
      isUploading: this.isUploading,
      config: { ...this.config }
    };
  }

  /**
   * Clear all events from buffer
   */
  clear() {
    this.events = [];
    this.failedEvents = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    
    console.log('Telemetry buffer cleared');
  }

  /**
   * Validate event structure
   * @param {Object} event - Event to validate
   * @returns {boolean} Whether event is valid
   */
  isValidEvent(event) {
    if (!event || typeof event !== 'object') {
      return false;
    }
    
    // Required fields
    const requiredFields = ['sessionId', 'type'];
    for (const field of requiredFields) {
      if (!event[field]) {
        return false;
      }
    }
    
    // Valid event types
    const validTypes = ['APP_FOCUS', 'PROMPT_SUBMIT'];
    if (!validTypes.includes(event.type)) {
      return false;
    }
    
    // Type-specific validation
    if (event.type === 'APP_FOCUS' && !event.appId) {
      return false;
    }
    
    if (event.type === 'PROMPT_SUBMIT' && !event.appId) {
      return false;
    }
    
    return true;
  }

  /**
   * Set up network status listeners
   */
  setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  /**
   * Clean up network listeners
   */
  cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    this.clear();
  }

  /**
   * Handle coming back online
   */
  handleOnline() {
    console.log('Network back online, resuming telemetry uploads');
    this.isOnline = true;
    
    // Resume processing
    if (this.events.length > 0) {
      this.scheduleBatchUpload();
    }
    
    // Retry failed events
    if (this.failedEvents.length > 0) {
      this.scheduleRetry();
    }
  }

  /**
   * Handle going offline
   */
  handleOffline() {
    console.log('Network offline, pausing telemetry uploads');
    this.isOnline = false;
    
    // Clear timers
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.TelemetryBuffer = TelemetryBuffer;
}

module.exports = TelemetryBuffer;