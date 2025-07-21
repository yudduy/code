console.log('[Codexel] Starting application initialization...');

require('dotenv').config();

if (require('electron-squirrel-startup')) {
    console.log('[Codexel] Electron squirrel startup detected, exiting...');
    process.exit(0);
}

console.log('[Codexel] Loading dependencies...');

const { app, BrowserWindow, shell, ipcMain, screen, path: electronPath } = require('electron');
const path = require('node:path');
const os = require('os');

console.log('[Codexel] Loading focusDetector...');
const focusDetector = require('./focusDetector');

console.log('[Codexel] Loading AssessmentWindowManager...');
const AssessmentWindowManager = require('./windows/assessmentWindowManager');

// Liquid Glass Detection and Initialization
console.log('[Codexel] Initializing liquid glass support...');

let liquidGlass;
const isLiquidGlassSupported = () => {
    if (process.platform !== 'darwin') {
        console.log('[Codexel] Not on macOS, liquid glass not supported');
        return false;
    }
    const majorVersion = parseInt(os.release().split('.')[0], 10);
    console.log(`[Codexel] macOS version: ${majorVersion}, liquid glass requires 26+`);
    return majorVersion >= 26; // macOS Tahoe (Darwin 26+) requirement
};

let shouldUseLiquidGlass = isLiquidGlassSupported();
if (shouldUseLiquidGlass) {
    try {
        liquidGlass = require('electron-liquid-glass');
        console.log('[Codexel] Liquid Glass support detected and loaded');
    } catch (e) {
        console.warn('[Codexel] Could not load electron-liquid-glass. Using fallback vibrancy.');
        shouldUseLiquidGlass = false;
    }
} else {
    console.log('[Codexel] Liquid Glass not supported, using fallback vibrancy');
}

// Initialize Assessment Window Manager
console.log('[Codexel] Creating AssessmentWindowManager...');
const windowManager = new AssessmentWindowManager(liquidGlass, shouldUseLiquidGlass);
global.assessmentWindowManager = windowManager; // Make available globally for focusDetector
console.log('[Codexel] AssessmentWindowManager created successfully');

// Window references for backward compatibility
let consentWindow = null;
let readyWindow = null;
let headerWindow = null;
let completionWindow = null;
let currentAssessmentState = 'AWAITING_CONSENT';

// Helper function to get current active window (with safety checks)
function getCurrentActiveWindow() {
    let window = null;
    
    switch (currentAssessmentState) {
        case 'AWAITING_CONSENT':
            window = consentWindow;
            break;
        case 'READY_TO_START':
            window = readyWindow;
            break;
        case 'ASSESSMENT_IN_PROGRESS':
            window = headerWindow;
            break;
        case 'ASSESSMENT_COMPLETE':
            window = completionWindow;
            break;
        default:
            return null;
    }
    
    // Return window only if it exists and is not destroyed
    if (window && !window.isDestroyed()) {
        return window;
    }
    
    // Log if we have a destroyed window reference
    if (window && window.isDestroyed()) {
        console.warn(`[Codexel] Window for state '${currentAssessmentState}' has been destroyed`);
    }
    
    return null;
}

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    process.exit(0);
}

// Focus main window if second instance is opened
app.on('second-instance', () => {
    console.log('[Codexel] Second instance detected, attempting to focus current window');
    
    // Focus the current active window based on assessment state
    const currentWindow = getCurrentActiveWindow();
    if (currentWindow && !currentWindow.isDestroyed()) {
        try {
            console.log(`[Codexel] Focusing window for state: ${currentAssessmentState}`);
            if (currentWindow.isMinimized()) {
                console.log('[Codexel] Restoring minimized window');
                currentWindow.restore();
            }
            currentWindow.focus();
            console.log('[Codexel] Window focused successfully');
        } catch (error) {
            console.error('[Codexel] Error focusing window:', error);
        }
    } else {
        console.log('[Codexel] No valid window found to focus, current state:', currentAssessmentState);
    }
});

app.whenReady().then(async () => {
    console.log('[Codexel] App ready, starting multi-window assessment application');

    if (process.env.NODE_ENV !== 'test') {
        const permissionManager = require('./permissionManager');
        const hasPermission = await permissionManager.checkAndRequestScreenRecordingPermission();

        if (!hasPermission) {
            console.log('[Codexel] Screen recording permission not granted. Halting app initialization.');
            return;
        }
    }
    
    try {
        // Setup IPC handlers first
        console.log('[Codexel] Setting up IPC handlers...');
        setupAssessmentIPC();
        
        // Create the consent window as the first window
        console.log('[Codexel] Creating consent window...');
        createConsentWindow();
        
        console.log('[Codexel] Assessment application ready with multi-window support');
    } catch (error) {
        console.error('[Codexel] Error during app initialization:', error);
        throw error;
    }
}).catch(error => {
    console.error('[Codexel] Fatal error during app startup:', error);
    process.exit(1);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', async () => {
    console.log('[Codexel] App is about to quit.');
    
    // Stop telemetry services
    try {
        focusDetector.stop();
        console.log('[Telemetry] Focus detector stopped');
    } catch (error) {
        console.warn('[Telemetry] Error stopping focus detector:', error.message);
    }
    
    // Close all assessment windows using window manager
    windowManager.closeAllWindows();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        // Recreate appropriate window based on current state
        switch (currentAssessmentState) {
            case 'AWAITING_CONSENT':
                createConsentWindow();
                break;
            case 'READY_TO_START':
                createReadyWindow();
                break;
            case 'ASSESSMENT_IN_PROGRESS':
                createHeaderWindow();
                break;
            case 'ASSESSMENT_COMPLETE':
                createCompletionWindow();
                break;
        }
    }
});

/**
 * Create the consent window (full screen overlay)
 */
function createConsentWindow() {
    consentWindow = windowManager.createConsentWindow();

    // Add window close event handler to clear reference
    consentWindow.on('closed', () => {
        console.log('[Codexel] Consent window closed, clearing reference');
        consentWindow = null;
    });

    // Open DevTools in development
    if (!app.isPackaged) {
        consentWindow.webContents.openDevTools({ mode: 'detach' });
    }

    console.log('[Codexel] Consent window created');
}

/**
 * Create the ready window (centered modal)
 */
function createReadyWindow() {
    readyWindow = windowManager.createReadyWindow();

    // Add window close event handler to clear reference
    readyWindow.on('closed', () => {
        console.log('[Codexel] Ready window closed, clearing reference');
        readyWindow = null;
    });

    // Open DevTools in development
    if (!app.isPackaged) {
        readyWindow.webContents.openDevTools({ mode: 'detach' });
    }

    console.log('[Codexel] Ready window created');
}

/**
 * Create the header window (collapsed assessment tracker)
 */
function createHeaderWindow() {
    headerWindow = windowManager.createHeaderWindow();

    // Add window close event handler to clear reference
    headerWindow.on('closed', () => {
        console.log('[Codexel] Header window closed, clearing reference');
        headerWindow = null;
    });

    // Open DevTools in development
    if (!app.isPackaged) {
        headerWindow.webContents.openDevTools({ mode: 'detach' });
    }

    // Start telemetry services for assessment tracking
    startAssessmentTelemetry();

    console.log('[Codexel] Header window created');
}

/**
 * Create the completion window (results display)
 */
function createCompletionWindow() {
    completionWindow = windowManager.createCompletionWindow();

    // Add window close event handler to clear reference
    completionWindow.on('closed', () => {
        console.log('[Codexel] Completion window closed, clearing reference');
        completionWindow = null;
    });

    // Open DevTools in development
    if (!app.isPackaged) {
        completionWindow.webContents.openDevTools({ mode: 'detach' });
    }

    console.log('[Codexel] Completion window created');
}

/**
 * Start assessment telemetry services
 */
async function startAssessmentTelemetry() {
    try {
        await focusDetector.start(headerWindow, 'assessment_session');
        console.log('[Telemetry] Focus detector started successfully');
    } catch (error) {
        console.warn('[Telemetry] Failed to start focus detector:', error.message);
    }
}

/**
 * Transition between assessment windows
 */
function transitionToWindow(fromWindow, toWindowCreator) {
    windowManager.transitionToWindow(fromWindow, toWindowCreator);
}

/**
 * Setup basic IPC handlers for assessment functionality
 */
function setupAssessmentIPC() {
    // Get app signatures for the MainHeader focused app indicator
    ipcMain.handle('get-app-signatures', () => {
        const { appSignatures } = require('../../shared/config/appSignatures');
        
        // Transform the app signatures to use direct file paths for images
        const transformedSignatures = {};
        for (const [appId, signature] of Object.entries(appSignatures)) {
            transformedSignatures[appId] = {
                ...signature,
                icon: signature.icon.includes('.png') || signature.icon.includes('.jpg') || signature.icon.includes('.svg') 
                    ? `./tools/${signature.icon.replace('tools/', '')}`
                    : signature.icon
            };
        }
        
        return transformedSignatures;
    });

    // Quit application handler
    ipcMain.handle('quit-application', () => {
        app.quit();
    });

    // Window collapse for assessment mode
    ipcMain.handle('collapse-to-header', () => {
        // This is now handled by window transitions
        return { success: true };
    });

    // Assessment state transitions
    ipcMain.handle('consent-accepted', () => {
        console.log('[Codexel] Consent accepted, transitioning to ready window');
        currentAssessmentState = 'READY_TO_START';
        transitionToWindow(consentWindow, createReadyWindow);
    });

    ipcMain.handle('consent-declined', () => {
        console.log('[Codexel] Consent declined, quitting application');
        app.quit();
    });

    ipcMain.handle('start-assessment', async () => {
        console.log('[Codexel] Starting assessment, transitioning to header window');
        currentAssessmentState = 'ASSESSMENT_IN_PROGRESS';
        
        // Open GitHub URL
        try {
            await shell.openExternal('https://github.com/');
        } catch (error) {
            console.error('[Codexel] Error opening GitHub URL:', error);
        }
        
        // Transition to header window
        transitionToWindow(readyWindow, createHeaderWindow);
    });

    ipcMain.handle('stop-assessment', () => {
        console.log('[Codexel] Stopping assessment, transitioning to completion window');
        currentAssessmentState = 'ASSESSMENT_COMPLETE';
        
        // Stop telemetry
        focusDetector.stop();
        
        // Transition to completion window
        transitionToWindow(headerWindow, createCompletionWindow);
    });

    // Timer update from assessment timer
    ipcMain.on('update-timer', (event, timerText) => {
        if (headerWindow && !headerWindow.isDestroyed()) {
            headerWindow.webContents.send('update-timer', timerText);
        }
    });

    // Word count update from prompt listener
    ipcMain.on('update-word-count', (event, wordCount) => {
        if (headerWindow && !headerWindow.isDestroyed()) {
            headerWindow.webContents.send('update-word-count', wordCount);
        }
    });

    console.log('[Codexel] Multi-window assessment IPC handlers registered');
}