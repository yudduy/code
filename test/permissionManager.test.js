import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import Module from 'module';

// Create test module cache
const testModuleCache = new Map();

describe('PermissionManager', () => {
  let mockSystemPreferences;
  let mockDesktopCapturer;
  let mockDialog;
  let mockApp;
  let mockBrowserWindow;
  let mockBrowserWindowInstance;
  let permissionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create fresh mock instances
    mockBrowserWindowInstance = {
      loadFile: vi.fn(),
      on: vi.fn((event, handler) => {
        if (event === 'ready-to-show') {
          process.nextTick(handler);
        }
      }),
      show: vi.fn(),
      focus: vi.fn(),
      close: vi.fn(),
    };

    mockSystemPreferences = {
      getMediaAccessStatus: vi.fn(),
    };

    mockDesktopCapturer = {
      getSources: vi.fn(),
    };

    mockDialog = {
      showMessageBoxSync: vi.fn(),
    };

    mockApp = {
      relaunch: vi.fn(),
      quit: vi.fn(),
    };

    mockBrowserWindow = vi.fn(() => mockBrowserWindowInstance);

    // Override require for electron module
    const originalRequire = Module.prototype.require;
    Module.prototype.require = function(id) {
      if (id === 'electron') {
        return {
          systemPreferences: mockSystemPreferences,
          desktopCapturer: mockDesktopCapturer,
          dialog: mockDialog,
          app: mockApp,
          BrowserWindow: mockBrowserWindow,
        };
      }
      if (id === 'path') {
        return {
          join: (...args) => args.join('/'),
        };
      }
      return originalRequire.apply(this, arguments);
    };

    // Clear the module cache for permissionManager
    delete require.cache[require.resolve('../src/main/permissionManager')];
    
    // Import fresh instance
    permissionManager = require('../src/main/permissionManager');
    
    // Restore require
    Module.prototype.require = originalRequire;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return true if permission is already granted', async () => {
    mockSystemPreferences.getMediaAccessStatus.mockReturnValue('granted');
    
    const hasPermission = await permissionManager.checkAndRequestScreenRecordingPermission();
    
    expect(hasPermission).toBe(true);
    expect(mockSystemPreferences.getMediaAccessStatus).toHaveBeenCalledWith('screen');
  });

  it('should request permission if status is not-determined and grant it', async () => {
    mockSystemPreferences.getMediaAccessStatus
      .mockReturnValueOnce('not-determined')
      .mockReturnValueOnce('granted');
    mockDesktopCapturer.getSources.mockResolvedValue([{}]);
    
    const hasPermission = await permissionManager.checkAndRequestScreenRecordingPermission();
    
    expect(mockDesktopCapturer.getSources).toHaveBeenCalledWith({ types: ['screen'] });
    expect(hasPermission).toBe(true);
  });

  it('should show denied window if permission is denied', async () => {
    mockSystemPreferences.getMediaAccessStatus.mockReturnValue('denied');
    
    const hasPermission = await permissionManager.checkAndRequestScreenRecordingPermission();
    
    expect(hasPermission).toBe(false);
    expect(mockBrowserWindow).toHaveBeenCalled();
    expect(mockBrowserWindowInstance.loadFile).toHaveBeenCalled();
  });

  it('should prompt for restart when permission is granted after polling', () => {
    vi.useFakeTimers();
    
    // Start with denied status
    mockSystemPreferences.getMediaAccessStatus.mockReturnValue('denied');
    
    // Start polling
    permissionManager.startPollingForPermissionChange();
    
    // Change status to granted
    mockSystemPreferences.getMediaAccessStatus.mockReturnValue('granted');
    
    // Advance timer to trigger the interval
    vi.advanceTimersByTime(3000);
    
    // Check that dialog was shown
    expect(mockDialog.showMessageBoxSync).toHaveBeenCalledWith({
      type: 'question',
      buttons: ['Restart Now', 'Later'],
      title: 'Permissions Granted',
      message: 'Screen recording permission has been granted. Please restart the application for the changes to take effect.',
      defaultId: 0,
      cancelId: 1
    });
    
    vi.useRealTimers();
  });

  it('should relaunch the app when user chooses to restart', () => {
    mockDialog.showMessageBoxSync.mockReturnValue(0);
    
    permissionManager.promptForRestart();
    
    expect(mockApp.relaunch).toHaveBeenCalled();
    expect(mockApp.quit).toHaveBeenCalled();
  });

  it('should not relaunch the app when user chooses not to restart', () => {
    mockDialog.showMessageBoxSync.mockReturnValue(1);
    
    permissionManager.promptForRestart();
    
    expect(mockApp.relaunch).not.toHaveBeenCalled();
    expect(mockApp.quit).not.toHaveBeenCalled();
  });
});