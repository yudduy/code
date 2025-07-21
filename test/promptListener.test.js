import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock DOM environment
const mockDocument = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  activeElement: null,
  body: {}
};

const mockWindow = {
  location: { hostname: '' }
};

global.document = mockDocument;
global.window = mockWindow;
global.MutationObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn()
}));

// Mock KeyboardEvent
global.KeyboardEvent = class KeyboardEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.key = options.key || '';
    this.ctrlKey = options.ctrlKey || false;
    this.metaKey = options.metaKey || false;
    this.shiftKey = options.shiftKey || false;
  }
};

// Import after setting up mocks
const PromptListener = require('../src/features/telemetry/components/PromptListener');

describe('PromptListener', () => {
  let promptListener;
  let mockElement;

  beforeEach(() => {
    vi.clearAllMocks();
    promptListener = new PromptListener();
    
    // Setup mock element
    mockElement = {
      tagName: 'TEXTAREA',
      className: 'chat-input',
      id: 'prompt-input',
      placeholder: 'Message ChatGPT',
      value: 'Test prompt text',
      matches: vi.fn(() => false),
      closest: vi.fn(() => null),
      getAttribute: vi.fn(() => null)
    };
  });

  afterEach(() => {
    if (promptListener) {
      promptListener.stop();
    }
  });

  describe('Lifecycle Management', () => {
    it('should start and stop listening correctly', () => {
      const sessionId = 'test-session-123';
      
      expect(promptListener.isListening).toBe(false);
      
      promptListener.start(sessionId);
      
      expect(promptListener.isListening).toBe(true);
      expect(promptListener.currentSessionId).toBe(sessionId);
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), true);
      
      promptListener.stop();
      
      expect(promptListener.isListening).toBe(false);
      expect(promptListener.currentSessionId).toBe(null);
      expect(mockDocument.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), true);
    });

    it('should handle consent setting', () => {
      expect(promptListener.consentGiven).toBe(false);
      
      promptListener.setConsent(true);
      expect(promptListener.consentGiven).toBe(true);
      
      promptListener.setConsent(false);
      expect(promptListener.consentGiven).toBe(false);
    });
  });

  describe('Prompt Submission Detection', () => {
    beforeEach(() => {
      promptListener.start('test-session');
    });

    it('should detect Ctrl+Enter as prompt submission', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false
      });
      
      vi.spyOn(promptListener, 'isInPromptContext').mockReturnValue(true);
      vi.spyOn(promptListener, 'getCurrentAppId').mockReturnValue('chatgpt');
      
      const result = promptListener.detectPromptSubmission(event);
      expect(result).toBe(true);
    });

    it('should detect Cmd+Enter as prompt submission', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: false,
        metaKey: true,
        shiftKey: false
      });
      
      vi.spyOn(promptListener, 'isInPromptContext').mockReturnValue(true);
      
      const result = promptListener.detectPromptSubmission(event);
      expect(result).toBe(true);
    });

    it('should not detect Shift+Enter as prompt submission', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
        shiftKey: true
      });
      
      const result = promptListener.detectPromptSubmission(event);
      expect(result).toBe(false);
    });

    it('should detect Enter in Cursor context', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false
      });
      
      vi.spyOn(promptListener, 'isInCursorPromptContext').mockReturnValue(true);
      
      const result = promptListener.detectPromptSubmission(event);
      expect(result).toBe(true);
    });
  });

  describe('Context Detection', () => {
    it('should identify ChatGPT prompt area', () => {
      mockDocument.activeElement = mockElement;
      mockElement.matches.mockImplementation(selector => 
        selector === '[data-testid="prompt-textarea"]'
      );
      
      const result = promptListener.isChatGPTPromptArea(mockElement);
      expect(result).toBe(true);
    });

    it('should identify Claude prompt area', () => {
      mockDocument.activeElement = mockElement;
      mockElement.matches.mockImplementation(selector => 
        selector === '[data-testid="chat-input"]'
      );
      
      const result = promptListener.isClaudePromptArea(mockElement);
      expect(result).toBe(true);
    });

    it('should identify Cursor prompt context', () => {
      mockDocument.activeElement = mockElement;
      mockElement.matches.mockImplementation(selector => 
        selector === '[data-testid="chat-input"]'
      );
      
      const result = promptListener.isInCursorPromptContext();
      expect(result).toBe(true);
    });

    it('should identify generic AI chat area', () => {
      mockDocument.activeElement = mockElement;
      mockElement.className = 'ai-input chat-interface';
      mockElement.matches.mockImplementation(selector => 
        selector === '.ai-input' || selector === '.chat-input'
      );
      
      const result = promptListener.isGenericAIChatArea(mockElement);
      expect(result).toBe(true);
    });
  });

  describe('App ID Detection', () => {
    it('should identify ChatGPT from hostname', () => {
      mockWindow.location.hostname = 'chat.openai.com';
      
      const result = promptListener.getCurrentAppId();
      expect(result).toBe('chatgpt');
    });

    it('should identify Claude from hostname', () => {
      mockWindow.location.hostname = 'claude.ai';
      
      const result = promptListener.getCurrentAppId();
      expect(result).toBe('claude');
    });

    it('should identify Cursor from hostname', () => {
      mockWindow.location.hostname = 'cursor.com';
      
      const result = promptListener.getCurrentAppId();
      expect(result).toBe('cursor');
    });

    it('should return unknown for unrecognized hostnames', () => {
      mockWindow.location.hostname = 'example.com';
      
      const result = promptListener.getCurrentAppId();
      expect(result).toBe('unknown');
    });
  });

  describe('Text Extraction', () => {
    beforeEach(() => {
      promptListener.setConsent(true);
      promptListener.start('test-session', { captureText: true });
    });

    it('should extract prompt text when consent is given', () => {
      mockDocument.activeElement = mockElement;
      mockElement.value = 'Test prompt message';
      
      const result = promptListener.extractPromptText();
      expect(result).toBe('Test prompt message');
    });

    it('should not extract text without consent', () => {
      promptListener.setConsent(false);
      mockDocument.activeElement = mockElement;
      mockElement.value = 'Test prompt message';
      
      const result = promptListener.extractPromptText();
      expect(result).toBe(null);
    });

    it('should handle empty text', () => {
      mockDocument.activeElement = mockElement;
      mockElement.value = '   ';
      
      const result = promptListener.extractPromptText();
      expect(result).toBe(null);
    });
  });

  describe('Event Recording', () => {
    beforeEach(() => {
      promptListener.start('test-session-456');
    });

    it('should record prompt submission event', () => {
      promptListener.recordPromptEvent('chatgpt', 'Test prompt');
      
      const events = promptListener.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        sessionId: 'test-session-456',
        type: 'PROMPT_SUBMIT',
        appId: 'chatgpt',
        prompt: 'Test prompt',
        ts: expect.any(Number)
      });
    });

    it('should record event without prompt text', () => {
      promptListener.recordPromptEvent('claude');
      
      const events = promptListener.getEvents();
      expect(events[0]).toMatchObject({
        sessionId: 'test-session-456',
        type: 'PROMPT_SUBMIT',
        appId: 'claude',
        prompt: null
      });
    });

    it('should clear events after getting them', () => {
      promptListener.recordPromptEvent('chatgpt', 'Test 1');
      promptListener.recordPromptEvent('claude', 'Test 2');
      
      expect(promptListener.getEvents()).toHaveLength(2);
      expect(promptListener.getEvents()).toHaveLength(0);
    });
  });

  describe('Keyboard Event Integration', () => {
    beforeEach(() => {
      promptListener.start('test-session');
      mockWindow.location.hostname = 'chat.openai.com';
    });

    it('should handle complete prompt submission flow', () => {
      // Setup context
      mockDocument.activeElement = mockElement;
      mockElement.matches.mockImplementation(selector => 
        selector === '[data-testid="prompt-textarea"]'
      );
      mockElement.value = 'Complete test prompt';
      
      // Enable text capture
      promptListener.setConsent(true);
      promptListener.capturePromptText = true;
      
      // Simulate Ctrl+Enter
      const event = {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false
      };
      
      promptListener.handleKeydown(event);
      
      const events = promptListener.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'PROMPT_SUBMIT',
        appId: 'chatgpt',
        prompt: 'Complete test prompt'
      });
    });

    it('should not record when not in prompt context', () => {
      mockDocument.activeElement = { 
        tagName: 'DIV',
        matches: vi.fn(() => false),
        closest: vi.fn(() => null)
      };
      
      const event = {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false
      };
      
      promptListener.handleKeydown(event);
      
      const events = promptListener.getEvents();
      expect(events).toHaveLength(0);
    });
  });
});