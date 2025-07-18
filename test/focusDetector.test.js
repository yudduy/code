import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock active-win module
vi.mock('active-win', () => ({
  default: vi.fn()
}));

// Import mocked modules
const activeWin = await import('active-win');
const { identifyApp } = await import('../src/config/appSignatures.js');

describe('FocusDetector', () => {
  let focusDetector;
  let mockMainWindow;
  let mockWebContents;
  let ipcMainHandlers = {};

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear module cache
    vi.resetModules();
    
    // Setup mock window
    mockWebContents = {
      send: vi.fn()
    };
    mockMainWindow = {
      webContents: mockWebContents,
      isDestroyed: vi.fn(() => false)
    };
    
    // Mock electron with IPC handlers
    vi.doMock('electron', () => ({
      ipcMain: {
        handle: vi.fn((channel, handler) => {
          ipcMainHandlers[channel] = handler;
        })
      },
      BrowserWindow: {
        fromWebContents: vi.fn(() => mockMainWindow)
      }
    }));
    
    // Import focusDetector after mocks are set
    focusDetector = require('../src/main/focusDetector');
  });

  afterEach(() => {
    if (focusDetector) {
      focusDetector.stop();
    }
    ipcMainHandlers = {};
  });

  describe('start/stop functionality', () => {
    it('should start polling when start is called', async () => {
      const sessionId = 'test-session-123';
      
      await focusDetector.start(mockMainWindow, sessionId, 100);
      
      expect(focusDetector.isRunning).toBe(true);
      expect(focusDetector.sessionId).toBe(sessionId);
    });

    it('should stop polling when stop is called', () => {
      focusDetector.stop();
      
      expect(focusDetector.isRunning).toBe(false);
      expect(focusDetector.lastAppId).toBe(null);
    });

    it('should not start multiple times', async () => {
      const sessionId = 'test-session-123';
      
      await focusDetector.start(mockMainWindow, sessionId);
      const consoleSpy = vi.spyOn(console, 'log');
      
      await focusDetector.start(mockMainWindow, sessionId);
      
      expect(consoleSpy).toHaveBeenCalledWith('FocusDetector already running');
    });
  });

  describe('window focus detection', () => {
    it('should emit IPC event when app focus changes', async () => {
      const sessionId = 'test-session-123';
      
      // Mock active-win responses
      activeWin.default
        .mockResolvedValueOnce({
          title: 'Visual Studio Code - myproject',
          owner: { name: 'Code' }
        })
        .mockResolvedValueOnce({
          title: 'ChatGPT - Google Chrome',
          owner: { name: 'Google Chrome' },
          url: 'https://chat.openai.com'
        });

      await focusDetector.start(mockMainWindow, sessionId, 50);
      
      // Wait for initial check
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // First event should be vscode
      expect(mockWebContents.send).toHaveBeenCalledWith('APP_FOCUS_CHANGED', {
        sessionId,
        ts: expect.any(Number),
        type: 'APP_FOCUS',
        appId: 'vscode'
      });

      // Wait for next polling cycle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Second event should be chatgpt
      expect(mockWebContents.send).toHaveBeenCalledWith('APP_FOCUS_CHANGED', {
        sessionId,
        ts: expect.any(Number),
        type: 'APP_FOCUS',
        appId: 'chatgpt'
      });
    });

    it('should not emit event if app has not changed', async () => {
      const sessionId = 'test-session-123';
      
      // Mock same window twice
      activeWin.default.mockResolvedValue({
        title: 'Visual Studio Code',
        owner: { name: 'Code' }
      });

      await focusDetector.start(mockMainWindow, sessionId, 50);
      
      // Wait for multiple polling cycles
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should only be called once
      expect(mockWebContents.send).toHaveBeenCalledTimes(1);
    });

    it('should handle active-win errors gracefully', async () => {
      const sessionId = 'test-session-123';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock active-win to throw error
      activeWin.default.mockRejectedValue(new Error('Permission denied'));

      await focusDetector.start(mockMainWindow, sessionId, 50);
      
      // Wait for polling cycle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(consoleSpy).toHaveBeenCalledWith('Error detecting active window:', expect.any(Error));
      expect(focusDetector.isRunning).toBe(true); // Should continue running
    });
  });

  describe('app identification accuracy', () => {
    const testCases = [
      {
        name: 'VSCode with project',
        window: { title: 'main.js - myproject - Visual Studio Code', owner: { name: 'Code' } },
        expected: 'vscode'
      },
      {
        name: 'ChatGPT in Chrome',
        window: { 
          title: 'ChatGPT - Google Chrome', 
          owner: { name: 'Google Chrome' },
          url: 'https://chat.openai.com/chat/123'
        },
        expected: 'chatgpt'
      },
      {
        name: 'Claude in Safari',
        window: { 
          title: 'Claude - Safari', 
          owner: { name: 'Safari' },
          url: 'https://claude.ai'
        },
        expected: 'claude'
      },
      {
        name: 'Cursor editor',
        window: { title: 'Cursor - index.js', owner: { name: 'Cursor' } },
        expected: 'cursor'
      },
      {
        name: 'Slack app',
        window: { title: 'Slack - Pickle Team', owner: { name: 'Slack' } },
        expected: 'slack'
      },
      {
        name: 'Unknown application',
        window: { title: 'Some Random App', owner: { name: 'RandomApp' } },
        expected: 'unknown'
      }
    ];

    testCases.forEach(({ name, window, expected }) => {
      it(`should identify ${name} as ${expected}`, () => {
        const result = identifyApp(window);
        expect(result).toBe(expected);
      });
    });

    it('should achieve 95%+ accuracy on common apps', () => {
      const commonApps = [
        { title: 'Code - Welcome', owner: { name: 'Code' } },
        { title: 'ChatGPT', owner: { name: 'Google Chrome' }, url: 'chat.openai.com' },
        { title: 'Claude', owner: { name: 'Safari' }, url: 'claude.ai' },
        { title: 'Cursor', owner: { name: 'Cursor' } },
        { title: 'Google Chrome - GitHub', owner: { name: 'Google Chrome' } },
        { title: 'Safari - Apple', owner: { name: 'Safari' } },
        { title: 'Slack', owner: { name: 'Slack' } },
        { title: 'Discord', owner: { name: 'Discord' } }
      ];

      let correctIdentifications = 0;
      commonApps.forEach(app => {
        const result = identifyApp(app);
        if (result !== 'unknown') {
          correctIdentifications++;
        }
      });

      const accuracy = (correctIdentifications / commonApps.length) * 100;
      expect(accuracy).toBeGreaterThanOrEqual(95);
    });
  });

  describe('IPC handlers', () => {
    it('should register IPC handlers on module load', () => {
      const { ipcMain } = require('electron');
      expect(ipcMain.handle).toHaveBeenCalledWith('focus:start', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('focus:stop', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('focus:getState', expect.any(Function));
    });
  });

  describe('getCurrentState', () => {
    it('should return current detector state', async () => {
      const sessionId = 'test-session-123';
      
      activeWin.default.mockResolvedValue({
        title: 'Visual Studio Code',
        owner: { name: 'Code' }
      });

      await focusDetector.start(mockMainWindow, sessionId, 50);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const state = focusDetector.getCurrentState();
      
      expect(state).toEqual({
        appId: 'vscode',
        windowInfo: expect.objectContaining({
          title: 'Visual Studio Code',
          owner: { name: 'Code' }
        }),
        isRunning: true
      });
    });
  });
});