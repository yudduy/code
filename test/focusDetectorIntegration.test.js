import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock active-win at the module level
const mockActiveWin = vi.fn(() => Promise.resolve({
  title: 'Test Window',
  owner: { name: 'TestApp' },
  url: 'https://example.com'
}));
vi.mock('active-win', () => ({
  default: mockActiveWin
}));

describe('FocusDetector Integration', () => {
  let focusDetector;
  let FocusDetectorClass;
  let mockWindow;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.useFakeTimers();
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Mock window
    mockWindow = {
      webContents: {
        send: vi.fn()
      },
      isDestroyed: vi.fn(() => false)
    };

    // Import after setting test env
    const module = require('../src/core/main/focusDetector');
    focusDetector = module;
    FocusDetectorClass = module.FocusDetector;
  });

  afterEach(() => {
    if (focusDetector && focusDetector.stop) {
      focusDetector.stop();
    }
    vi.useRealTimers();
    delete process.env.NODE_ENV;
  });

  it('should detect window focus changes and emit IPC events', async () => {
    const sessionId = 'test-123';
    
    // Mock window sequence - provide persistent mock
    let callCount = 0;
    mockActiveWin.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          title: 'Visual Studio Code',
          owner: { name: 'Code' }
        });
      } else {
        return Promise.resolve({
          title: 'ChatGPT - Google Chrome',
          owner: { name: 'Google Chrome' },
          url: 'https://chat.openai.com'
        });
      }
    });

    // Start detector with fast polling
    await focusDetector.start(mockWindow, sessionId, 50);
    
    // Wait for initial detection
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify first event
    expect(mockWindow.webContents.send).toHaveBeenCalledWith('APP_FOCUS_CHANGED', {
      sessionId,
      ts: expect.any(Number),
      type: 'APP_FOCUS',
      appId: 'vscode'
    });
    
    // Wait for second detection
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify second event
    expect(mockWindow.webContents.send).toHaveBeenCalledWith('APP_FOCUS_CHANGED', {
      sessionId,
      ts: expect.any(Number),
      type: 'APP_FOCUS',
      appId: 'chatgpt'
    });
  });

  it('should track running state correctly', () => {
    expect(focusDetector.isRunning).toBe(false);
    
    focusDetector.start(mockWindow, 'test-456', 50);
    expect(focusDetector.isRunning).toBe(true);
    
    focusDetector.stop();
    expect(focusDetector.isRunning).toBe(false);
  });

  it('should get current state', async () => {
    const sessionId = 'test-789';
    
    mockActiveWin.mockResolvedValue({
      title: 'Slack - Codexel Team',
      owner: { name: 'Slack' }
    });

    await focusDetector.start(mockWindow, sessionId, 50);
    await new Promise(resolve => setTimeout(resolve, 100));
    focusDetector.stop();
    
    const state = focusDetector.getCurrentState();
    
    expect(state).toEqual({
      appId: 'slack',
      windowInfo: expect.objectContaining({
        title: 'Slack - Codexel Team'
      }),
      isRunning: false
    });
  });

  it('should not emit duplicate events for same app', async () => {
    const sessionId = 'test-no-dup';
    
    // Mock same window multiple times
    mockActiveWin.mockResolvedValue({
      title: 'Visual Studio Code',
      owner: { name: 'Code' }
    });

    await focusDetector.start(mockWindow, sessionId, 50);
    
    // Wait for multiple polling cycles
    await new Promise(resolve => setTimeout(resolve, 200));
    focusDetector.stop();
    
    // Should only emit once
    expect(mockWindow.webContents.send).toHaveBeenCalledTimes(1);
  });
});