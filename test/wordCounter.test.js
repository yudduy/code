import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PromptListener from '../src/features/telemetry/components/PromptListener.js';

describe('PromptListener Word Counter', () => {
  let promptListener;
  let mockWordCountCallback;
  let mockTextarea;
  let mockDocument;

  beforeEach(() => {
    mockWordCountCallback = vi.fn();
    
    // Mock DOM elements
    mockTextarea = {
      tagName: 'TEXTAREA',
      value: '',
      matches: vi.fn(),
      closest: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    // Mock document
    mockDocument = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      activeElement: mockTextarea,
      body: mockTextarea
    };

    // Mock DOM APIs
    global.MutationObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: vi.fn()
    }));

    // Mock global document
    global.document = mockDocument;
    global.window = {
      location: { hostname: 'chat.openai.com' }
    };

    promptListener = new PromptListener();
  });

  afterEach(() => {
    if (promptListener) {
      promptListener.stop();
    }
    vi.clearAllMocks();
  });

  describe('Word Counting Logic', () => {
    it('should count words correctly', () => {
      expect(promptListener.countWords('')).toBe(0);
      expect(promptListener.countWords('hello')).toBe(1);
      expect(promptListener.countWords('hello world')).toBe(2);
      expect(promptListener.countWords('  hello   world  ')).toBe(2);
      expect(promptListener.countWords('hello\nworld\ttest')).toBe(3);
    });

    it('should handle special characters and punctuation', () => {
      expect(promptListener.countWords('hello, world!')).toBe(2);
      expect(promptListener.countWords('hello-world')).toBe(1);
      expect(promptListener.countWords('hello@world.com')).toBe(1);
      expect(promptListener.countWords('$100 for this')).toBe(3);
    });

    it('should handle empty and whitespace-only strings', () => {
      expect(promptListener.countWords('')).toBe(0);
      expect(promptListener.countWords('   ')).toBe(0);
      expect(promptListener.countWords('\n\t')).toBe(0);
      expect(promptListener.countWords(null)).toBe(0);
      expect(promptListener.countWords(undefined)).toBe(0);
    });

    it('should handle very long text', () => {
      const longText = 'word '.repeat(1000);
      expect(promptListener.countWords(longText)).toBe(1000);
    });
  });

  describe('Word Count Callbacks', () => {
    it('should register word count callback', () => {
      promptListener.onWordCountChange(mockWordCountCallback);
      expect(promptListener.wordCountCallbacks).toContain(mockWordCountCallback);
    });

    it('should remove word count callback', () => {
      promptListener.onWordCountChange(mockWordCountCallback);
      promptListener.removeWordCountCallback(mockWordCountCallback);
      expect(promptListener.wordCountCallbacks).not.toContain(mockWordCountCallback);
    });

    it('should call callbacks when word count changes', () => {
      promptListener.onWordCountChange(mockWordCountCallback);
      
      mockTextarea.value = 'hello world';
      promptListener.updateWordCount(mockTextarea);
      
      expect(mockWordCountCallback).toHaveBeenCalledWith(2);
    });

    it('should not call callbacks if word count hasnt changed', () => {
      promptListener.onWordCountChange(mockWordCountCallback);
      promptListener.currentWordCount = 2;
      
      mockTextarea.value = 'hello world';
      promptListener.updateWordCount(mockTextarea);
      
      expect(mockWordCountCallback).not.toHaveBeenCalled();
    });
  });

  describe('Prompt Input Detection', () => {
    it('should detect ChatGPT prompt area', () => {
      mockTextarea.matches = vi.fn().mockReturnValue(true);
      expect(promptListener.isChatGPTPromptArea(mockTextarea)).toBe(true);
    });

    it('should detect Claude prompt area', () => {
      mockTextarea.matches = vi.fn().mockReturnValue(false);
      mockTextarea.closest = vi.fn().mockReturnValue(mockTextarea);
      expect(promptListener.isClaudePromptArea(mockTextarea)).toBe(true);
    });

    it('should identify prompt input elements', () => {
      mockTextarea.matches = vi.fn().mockReturnValue(true);
      expect(promptListener.isPromptInput(mockTextarea)).toBe(true);
    });

    it('should reject non-input elements', () => {
      const mockDiv = {
        tagName: 'DIV',
        matches: vi.fn().mockReturnValue(false),
        closest: vi.fn().mockReturnValue(null)
      };
      
      expect(promptListener.isPromptInput(mockDiv)).toBe(false);
    });
  });

  describe('Real-time Word Counting', () => {
    beforeEach(() => {
      promptListener.start('test-session');
      promptListener.onWordCountChange(mockWordCountCallback);
    });

    it('should track word count in real-time', () => {
      // Simulate user typing
      mockTextarea.value = 'hello';
      promptListener.updateWordCount(mockTextarea);
      expect(mockWordCountCallback).toHaveBeenCalledWith(1);
      
      mockTextarea.value = 'hello world';
      promptListener.updateWordCount(mockTextarea);
      expect(mockWordCountCallback).toHaveBeenCalledWith(2);
    });

    it('should reset word count to zero', () => {
      promptListener.currentWordCount = 5;
      promptListener.resetWordCount();
      
      expect(promptListener.currentWordCount).toBe(0);
      expect(mockWordCountCallback).toHaveBeenCalledWith(0);
    });

    it('should get current word count', () => {
      promptListener.currentWordCount = 42;
      expect(promptListener.getCurrentWordCount()).toBe(42);
    });
  });

  describe('Focus and Blur Handling', () => {
    beforeEach(() => {
      promptListener.start('test-session');
      promptListener.onWordCountChange(mockWordCountCallback);
    });

    it('should start counting when prompt input is focused', () => {
      mockTextarea.matches = vi.fn().mockReturnValue(true);
      mockTextarea.value = 'hello world';
      
      const focusEvent = {
        target: mockTextarea
      };
      
      promptListener.handleFocus(focusEvent);
      
      expect(promptListener.activePromptElement).toBe(mockTextarea);
      expect(mockWordCountCallback).toHaveBeenCalledWith(2);
    });

    it('should stop counting when prompt input loses focus', () => {
      promptListener.activePromptElement = mockTextarea;
      promptListener.currentWordCount = 5;
      
      const blurEvent = {
        target: mockTextarea
      };
      
      promptListener.handleBlur(blurEvent);
      
      expect(promptListener.activePromptElement).toBeNull();
      expect(mockWordCountCallback).toHaveBeenCalledWith(0);
    });
  });

  describe('Integration with Session Management', () => {
    it('should reset word count on prompt submission', () => {
      promptListener.start('test-session');
      promptListener.onWordCountChange(mockWordCountCallback);
      promptListener.currentWordCount = 10;
      
      // Simulate prompt submission
      promptListener.resetWordCount();
      
      expect(promptListener.currentWordCount).toBe(0);
      expect(mockWordCountCallback).toHaveBeenCalledWith(0);
    });

    it('should maintain word count state during session', () => {
      promptListener.start('test-session');
      promptListener.onWordCountChange(mockWordCountCallback);
      
      mockTextarea.value = 'test prompt';
      promptListener.updateWordCount(mockTextarea);
      
      expect(promptListener.getCurrentWordCount()).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      promptListener.onWordCountChange(errorCallback);
      promptListener.onWordCountChange(mockWordCountCallback);
      
      // Should not throw error
      expect(() => {
        promptListener.notifyWordCountChange(5);
      }).not.toThrow();
      
      // Other callbacks should still work
      expect(mockWordCountCallback).toHaveBeenCalledWith(5);
    });

    it('should handle invalid input gracefully', () => {
      expect(() => {
        promptListener.updateWordCount(null);
      }).not.toThrow();
      
      expect(() => {
        promptListener.updateWordCount(undefined);
      }).not.toThrow();
    });
  });
});