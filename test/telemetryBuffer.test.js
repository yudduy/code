import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    onlineState: true
  },
  writable: true
});

// Mock window for events
const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};
global.window = mockWindow;

// Import after setting up mocks
const TelemetryBuffer = require('../src/features/listen/telemetryBuffer');

describe('TelemetryBuffer', () => {
  let buffer;
  let mockConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    mockConfig = {
      batchSize: 3,
      maxBatchWaitTime: 1000,
      maxRetries: 2,
      retryDelay: 500,
      maxQueueSize: 10,
      endpoint: '/test-ingest'
    };
    
    buffer = new TelemetryBuffer(mockConfig);
    
    // Mock successful fetch by default
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  afterEach(() => {
    if (buffer) {
      buffer.cleanup();
    }
    vi.useRealTimers();
  });

  describe('Event Validation', () => {
    it('should validate required fields', () => {
      expect(buffer.isValidEvent({})).toBe(false);
      expect(buffer.isValidEvent({ sessionId: 'test' })).toBe(false);
      expect(buffer.isValidEvent({ sessionId: 'test', type: 'APP_FOCUS' })).toBe(false);
      expect(buffer.isValidEvent({ 
        sessionId: 'test', 
        type: 'APP_FOCUS', 
        appId: 'vscode' 
      })).toBe(true);
    });

    it('should validate event types', () => {
      expect(buffer.isValidEvent({
        sessionId: 'test',
        type: 'INVALID_TYPE',
        appId: 'vscode'
      })).toBe(false);
      
      expect(buffer.isValidEvent({
        sessionId: 'test',
        type: 'APP_FOCUS',
        appId: 'vscode'
      })).toBe(true);
      
      expect(buffer.isValidEvent({
        sessionId: 'test',
        type: 'PROMPT_SUBMIT',
        appId: 'chatgpt'
      })).toBe(true);
    });
  });

  describe('Event Addition', () => {
    it('should add valid events to buffer', () => {
      const event = {
        sessionId: 'test-123',
        type: 'APP_FOCUS',
        appId: 'vscode'
      };
      
      const result = buffer.addEvent(event);
      
      expect(result).toBe(true);
      expect(buffer.events).toHaveLength(1);
      expect(buffer.events[0]).toMatchObject(event);
      expect(buffer.events[0].ts).toBeDefined();
    });

    it('should reject invalid events', () => {
      const result = buffer.addEvent({ invalid: 'event' });
      
      expect(result).toBe(false);
      expect(buffer.events).toHaveLength(0);
    });

    it('should respect queue size limit', () => {
      // Go offline to prevent auto-processing
      buffer.handleOffline();
      
      // Fill buffer beyond capacity
      for (let i = 0; i < mockConfig.maxQueueSize + 3; i++) {
        buffer.addEvent({
          sessionId: 'test',
          type: 'APP_FOCUS',
          appId: 'test-app',
          sequence: i
        });
      }
      
      expect(buffer.events).toHaveLength(mockConfig.maxQueueSize);
      // Should have dropped oldest events
      expect(buffer.events[0].sequence).toBe(3);
    });

    it('should add multiple events', () => {
      const events = [
        { sessionId: 'test', type: 'APP_FOCUS', appId: 'vscode' },
        { sessionId: 'test', type: 'PROMPT_SUBMIT', appId: 'chatgpt' }
      ];
      
      const result = buffer.addEvents(events);
      
      expect(result).toBe(true);
      expect(buffer.events).toHaveLength(2);
    });
  });

  describe('Batch Processing', () => {
    it('should process batch when size threshold is reached', async () => {
      // Add enough events to trigger immediate batch
      for (let i = 0; i < mockConfig.batchSize; i++) {
        buffer.addEvent({
          sessionId: 'test',
          type: 'APP_FOCUS',
          appId: 'test-app'
        });
      }
      
      // Wait for async processing
      await vi.runAllTimersAsync();
      
      expect(global.fetch).toHaveBeenCalledWith('/test-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"events"')
      });
      
      expect(buffer.events).toHaveLength(0);
    });

    it('should process batch after timeout', async () => {
      // Add one event (below batch size)
      buffer.addEvent({
        sessionId: 'test',
        type: 'APP_FOCUS',
        appId: 'test-app'
      });
      
      expect(buffer.events).toHaveLength(1);
      expect(global.fetch).not.toHaveBeenCalled();
      
      // Fast-forward time
      await vi.advanceTimersByTimeAsync(mockConfig.maxBatchWaitTime);
      
      expect(global.fetch).toHaveBeenCalled();
      expect(buffer.events).toHaveLength(0);
    });

    it('should not process batch when offline', async () => {
      buffer.isOnline = false;
      
      for (let i = 0; i < mockConfig.batchSize; i++) {
        buffer.addEvent({
          sessionId: 'test',
          type: 'APP_FOCUS',
          appId: 'test-app'
        });
      }
      
      await vi.runAllTimersAsync();
      
      expect(global.fetch).not.toHaveBeenCalled();
      expect(buffer.events).toHaveLength(mockConfig.batchSize);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed uploads', async () => {
      // Make fetch fail
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      buffer.addEvent({
        sessionId: 'test',
        type: 'APP_FOCUS',
        appId: 'test-app'
      });
      
      await vi.advanceTimersByTimeAsync(mockConfig.maxBatchWaitTime);
      
      expect(buffer.failedEvents).toHaveLength(1);
      expect(buffer.failedEvents[0]._retryCount).toBe(1);
      
      // Restore successful fetch
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      // Advance time for retry
      await vi.advanceTimersByTimeAsync(mockConfig.retryDelay * 2);
      
      expect(buffer.failedEvents).toHaveLength(0);
    });

    it('should drop events after max retries', async () => {
      // Make fetch always fail
      global.fetch.mockRejectedValue(new Error('Persistent error'));
      
      buffer.addEvent({
        sessionId: 'test',
        type: 'APP_FOCUS',
        appId: 'test-app'
      });
      
      // Trigger initial upload and retries
      await vi.advanceTimersByTimeAsync(mockConfig.maxBatchWaitTime);
      
      for (let i = 0; i < mockConfig.maxRetries + 1; i++) {
        await vi.advanceTimersByTimeAsync(mockConfig.retryDelay * Math.pow(2, i + 1));
      }
      
      expect(buffer.failedEvents).toHaveLength(0);
      expect(buffer.events).toHaveLength(0);
    });

    it('should use exponential backoff for retries', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      buffer.addEvent({
        sessionId: 'test',
        type: 'APP_FOCUS',
        appId: 'test-app'
      });
      
      await vi.advanceTimersByTimeAsync(mockConfig.maxBatchWaitTime);
      
      expect(buffer.failedEvents[0]._retryCount).toBe(1);
      
      // Clear previous calls
      global.fetch.mockClear();
      
      // Advance by base retry delay - should not retry yet
      await vi.advanceTimersByTimeAsync(mockConfig.retryDelay);
      expect(global.fetch).not.toHaveBeenCalled();
      
      // Advance by full exponential backoff delay
      await vi.advanceTimersByTimeAsync(mockConfig.retryDelay);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Network Status Handling', () => {
    it('should pause uploads when going offline', () => {
      buffer.handleOffline();
      
      expect(buffer.isOnline).toBe(false);
      
      buffer.addEvent({
        sessionId: 'test',
        type: 'APP_FOCUS',
        appId: 'test-app'
      });
      
      // Should not upload when offline
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should resume uploads when coming back online', async () => {
      // Go offline and add events
      buffer.handleOffline();
      buffer.addEvent({
        sessionId: 'test',
        type: 'APP_FOCUS',
        appId: 'test-app'
      });
      
      expect(buffer.events).toHaveLength(1);
      
      // Come back online
      buffer.handleOnline();
      
      await vi.runAllTimersAsync();
      
      expect(global.fetch).toHaveBeenCalled();
      expect(buffer.events).toHaveLength(0);
    });
  });

  describe('Utility Methods', () => {
    it('should provide buffer statistics', () => {
      buffer.addEvent({ sessionId: 'test', type: 'APP_FOCUS', appId: 'test' });
      buffer.failedEvents.push({ sessionId: 'test', type: 'APP_FOCUS', appId: 'failed' });
      
      const stats = buffer.getStats();
      
      expect(stats).toMatchObject({
        pendingEvents: 1,
        failedEvents: 1,
        isOnline: true,
        isUploading: false,
        config: expect.objectContaining(mockConfig)
      });
    });

    it('should flush all pending events', async () => {
      // Add multiple events (less than batch size to avoid auto-processing)
      for (let i = 0; i < 2; i++) {
        buffer.addEvent({
          sessionId: 'test',
          type: 'APP_FOCUS',
          appId: 'test-app'
        });
      }
      
      // Add failed events
      buffer.failedEvents.push({
        sessionId: 'test',
        type: 'APP_FOCUS',
        appId: 'failed-app',
        _retryCount: 1
      });
      
      await buffer.flush();
      
      expect(buffer.events).toHaveLength(0);
      expect(buffer.failedEvents).toHaveLength(0);
      expect(global.fetch).toHaveBeenCalledTimes(2); // One for main events, one for failed
    });

    it('should clear all events and timers', () => {
      buffer.addEvent({ sessionId: 'test', type: 'APP_FOCUS', appId: 'test' });
      buffer.failedEvents.push({ sessionId: 'test', type: 'APP_FOCUS', appId: 'failed' });
      
      // Set up some timers
      buffer.scheduleBatchUpload();
      
      buffer.clear();
      
      expect(buffer.events).toHaveLength(0);
      expect(buffer.failedEvents).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      buffer.addEvent({
        sessionId: 'test',
        type: 'APP_FOCUS',
        appId: 'test-app'
      });
      
      await vi.advanceTimersByTimeAsync(mockConfig.maxBatchWaitTime);
      
      // Should not throw, should add to failed events
      expect(buffer.failedEvents).toHaveLength(1);
      expect(buffer.failedEvents[0]._lastError).toBe('Network error');
    });

    it('should handle HTTP errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      buffer.addEvent({
        sessionId: 'test',
        type: 'APP_FOCUS',
        appId: 'test-app'
      });
      
      await vi.advanceTimersByTimeAsync(mockConfig.maxBatchWaitTime);
      
      expect(buffer.failedEvents).toHaveLength(1);
      expect(buffer.failedEvents[0]._lastError).toContain('500');
    });
  });
});