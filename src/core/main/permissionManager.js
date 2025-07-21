
const { systemPreferences, desktopCapturer, dialog, app, BrowserWindow } = require('electron');
const path = require('path');

class PermissionManager {
  constructor() {
    this.isPolling = false;
    this.permissionWindow = null;
  }

  async checkAndRequestScreenRecordingPermission() {
    let status = systemPreferences.getMediaAccessStatus('screen');

    if (status === 'not-determined') {
      try {
        await desktopCapturer.getSources({ types: ['screen'] });
        status = systemPreferences.getMediaAccessStatus('screen');
      } catch (error) {
        console.error('Error triggering screen recording permission prompt:', error);
        status = 'denied';
      }
    }

    if (status === 'denied') {
      this.showPermissionDeniedWindow();
      this.startPollingForPermissionChange();
      return false;
    }

    return status === 'granted';
  }

  showPermissionDeniedWindow() {
    if (this.permissionWindow) {
        this.permissionWindow.focus();
        return;
    }

    this.permissionWindow = new BrowserWindow({
        width: 520,
        height: 400,
        webPreferences: {
            preload: path.join(__dirname, '../../../preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        frame: false,
        transparent: true,
        show: false,
    });

    this.permissionWindow.loadFile(path.join(__dirname, '../../../src/app/permission-denied.html'));

    this.permissionWindow.on('ready-to-show', () => {
        this.permissionWindow.show();
    });

    this.permissionWindow.on('closed', () => {
        this.permissionWindow = null;
    });
  }

  startPollingForPermissionChange() {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    const interval = setInterval(() => {
      const status = systemPreferences.getMediaAccessStatus('screen');
      if (status === 'granted') {
        clearInterval(interval);
        this.isPolling = false;
        if (this.permissionWindow) {
            this.permissionWindow.close();
        }
        this.promptForRestart();
      }
    }, 3000);
  }

  promptForRestart() {
    const choice = dialog.showMessageBoxSync({
      type: 'question',
      buttons: ['Restart Now', 'Later'],
      title: 'Permissions Granted',
      message: 'Screen recording permission has been granted. Please restart the application for the changes to take effect.',
      defaultId: 0,
      cancelId: 1
    });

    if (choice === 0) {
      app.relaunch();
      app.quit();
    }
  }
}

module.exports = new PermissionManager();
