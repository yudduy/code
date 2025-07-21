const activeWin = require('active-win');
const { identifyApp } = require('../../shared/config/appSignatures');

class FocusDetector {
  constructor() {
    this.pollingInterval = null;
    this.lastAppId = null;
    this.lastWindowInfo = null;
    this.isRunning = false;
    this.sessionId = null;
    this.mainWindow = null;
  }

  /**
   * Start polling for active window changes
   * @param {BrowserWindow} [mainWindow] - Electron main window (optional)
   * @param {string} [sessionId] - Current session ID (optional)
   * @param {number} interval - Polling interval in milliseconds
   */
  async start(mainWindow = null, sessionId = null, interval = 1000) {
    if (this.isRunning) {
      console.log('FocusDetector already running');
      return;
    }

    this.mainWindow = mainWindow;
    this.sessionId = sessionId;
    this.isRunning = true;

    console.log('Starting FocusDetector with interval:', interval);

    // Check initial window
    await this.checkActiveWindow();

    // Start polling
    this.pollingInterval = setInterval(async () => {
      await this.checkActiveWindow();
    }, interval);
  }

  /**
   * Stop polling for active window changes
   */
  stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isRunning = false;
    this.lastAppId = null;
    this.lastWindowInfo = null;
    console.log('FocusDetector stopped');
  }

  /**
   * Check current active window and emit event if changed
   */
  async checkActiveWindow() {
    try {
      const windowInfo = await activeWin();
      
      if (!windowInfo) {
        return;
      }

      const appId = identifyApp(windowInfo);
      
      // Check if app has changed
      if (appId !== this.lastAppId) {
        const event = {
          sessionId: this.sessionId,
          ts: Date.now(),
          type: 'APP_FOCUS',
          appId: appId
        };

        console.log('App focus changed:', event);
        
        // Send to renderer process - prioritize header window for UI updates
        this.sendToWindows('APP_FOCUS_CHANGED', event);

        // Update last known state
        this.lastAppId = appId;
        this.lastWindowInfo = windowInfo;
      }
    } catch (error) {
      console.error('Error detecting active window:', error);
    }
  }

  /**
   * Send event to renderer windows
   * @param {string} channel - IPC channel name
   * @param {any} data - Data to send
   */
  sendToWindows(channel, data) {
    try {
      // Try assessment window manager first (for Codexel assessment app)
      const assessmentWindowManager = global.assessmentWindowManager;
      if (assessmentWindowManager) {
        const headerWindow = assessmentWindowManager.getWindow('header');
        if (headerWindow && !headerWindow.isDestroyed()) {
          headerWindow.webContents.send(channel, data);
        }
      }
      
      // Also send to main window if available
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send(channel, data);
      }
    } catch (error) {
      console.error('Error sending to windows:', error);
    }
  }

  /**
   * Get current focus state
   */
  getCurrentState() {
    return {
      appId: this.lastAppId,
      windowInfo: this.lastWindowInfo,
      isRunning: this.isRunning
    };
  }
}

// Create singleton instance
const focusDetector = new FocusDetector();

// Setup IPC handlers - only if running in Electron environment
function setupIPCHandlers() {
  try {
    const { ipcMain, BrowserWindow } = require('electron');
    
    ipcMain.handle('focus:start', async (event, sessionId) => {
      const senderWindow = BrowserWindow.fromWebContents(event.sender);
      await focusDetector.start(senderWindow, sessionId);
      return { success: true };
    });

    ipcMain.handle('focus:stop', async () => {
      focusDetector.stop();
      return { success: true };
    });

    ipcMain.handle('focus:getState', async () => {
      return focusDetector.getCurrentState();
    });
  } catch (err) {
    console.log('Running outside Electron environment, skipping IPC setup');
  }
}

// Only setup IPC if not in test environment
if (process.env.NODE_ENV !== 'test') {
  setupIPCHandlers();
}

module.exports = focusDetector;
module.exports.FocusDetector = FocusDetector;
module.exports.setupIPCHandlers = setupIPCHandlers;