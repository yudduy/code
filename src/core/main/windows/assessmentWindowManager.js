const { BrowserWindow, screen } = require('electron');
const path = require('node:path');

/**
 * Assessment Window Manager
 * Centralizes window management for the Glass assessment application
 * while preserving all existing functionality and assessment workflow
 */
class AssessmentWindowManager {
    constructor(liquidGlass, shouldUseLiquidGlass) {
        this.liquidGlass = liquidGlass;
        this.shouldUseLiquidGlass = shouldUseLiquidGlass;
        
        // Window pool to track all assessment windows
        this.windowPool = new Map();
        
        // Base window options shared across all assessment windows
        this.baseWindowOptions = {
            frame: false,
            transparent: true,
            vibrancy: this.shouldUseLiquidGlass ? false : (process.platform === 'darwin' ? 'under-window' : undefined),
            backgroundColor: process.platform === 'win32' ? '#00000000' : undefined,
            hasShadow: !this.shouldUseLiquidGlass, // Let liquid glass handle shadows
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                backgroundThrottling: false,
                webSecurity: true,
                preload: path.join(__dirname, '../renderer/preload.js'),
            },
        };
    }

    /**
     * Create a window with liquid glass support
     * @param {string} name - Window identifier for the pool
     * @param {Object} options - BrowserWindow options
     * @param {string} htmlFile - HTML file to load
     * @returns {BrowserWindow} The created window
     */
    createWindow(name, options, htmlFile) {
        // Merge base options with specific window options
        const windowOptions = {
            ...this.baseWindowOptions,
            ...options
        };

        const window = new BrowserWindow(windowOptions);

        // Enable glass effect on macOS
        if (process.platform === 'darwin') {
            window.setWindowButtonVisibility(false);
        }

        // Load the window content with glass parameter if supported
        const loadOptions = {};
        if (this.shouldUseLiquidGlass) {
            loadOptions.query = { glass: 'true' };
        }
        window.loadFile(htmlFile, loadOptions);

        // Apply liquid glass effect after content loads
        if (this.shouldUseLiquidGlass) {
            window.webContents.once('did-finish-load', () => {
                this.applyLiquidGlass(window, name);
            });
        }

        // Store in window pool
        this.windowPool.set(name, window);

        // Handle window close
        window.on('closed', () => {
            this.windowPool.delete(name);
        });

        return window;
    }

    /**
     * Apply liquid glass effect to a window
     * @param {BrowserWindow} window - The window to apply effect to
     * @param {string} windowName - Window name for logging
     */
    applyLiquidGlass(window, windowName) {
        if (!this.liquidGlass || !this.shouldUseLiquidGlass) return;

        try {
            const viewId = this.liquidGlass.addView(window.getNativeWindowHandle(), {
                cornerRadius: 12,
                tintColor: '#FF00001A', // Red tint for assessment theme
                opaque: false,
            });
            if (viewId !== -1) {
                this.liquidGlass.unstable_setVariant(viewId, 2);
                console.log(`[AssessmentWindowManager] Liquid Glass applied to ${windowName} window`);
            }
        } catch (error) {
            console.error(`[AssessmentWindowManager] Failed to apply liquid glass to ${windowName} window:`, error);
        }
    }

    /**
     * Create consent window (full screen overlay)
     * @returns {BrowserWindow} The consent window
     */
    createConsentWindow() {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

        const options = {
            width: screenWidth,
            height: screenHeight,
            x: 0,
            y: 0,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: false,
            minimizable: false,
            maximizable: false,
            closable: true,
            focusable: true,
            fullscreen: false,
        };

        return this.createWindow(
            'consent',
            options,
            path.join(__dirname, '../../../app/consent-window.html')
        );
    }

    /**
     * Create ready window (centered modal)
     * @returns {BrowserWindow} The ready window
     */
    createReadyWindow() {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

        const windowWidth = 600;
        const windowHeight = 500;
        const x = Math.round((screenWidth - windowWidth) / 2);
        const y = Math.round((screenHeight - windowHeight) / 2);

        const options = {
            width: windowWidth,
            height: windowHeight,
            x: x,
            y: y,
            alwaysOnTop: true,
            skipTaskbar: false,
            resizable: false,
            minimizable: false,
            maximizable: false,
            closable: true,
            focusable: true,
        };

        return this.createWindow(
            'ready',
            options,
            path.join(__dirname, '../../../app/ready-window.html')
        );
    }

    /**
     * Create header window (collapsed assessment tracker)
     * @returns {BrowserWindow} The header window
     */
    createHeaderWindow() {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth } = primaryDisplay.workAreaSize;

        const windowWidth = 390;
        const windowHeight = 52;
        const x = Math.round((screenWidth - windowWidth) / 2);
        const y = 21;

        const options = {
            width: windowWidth,
            height: windowHeight,
            x: x,
            y: y,
            alwaysOnTop: true,
            skipTaskbar: false,
            resizable: false,
            minimizable: false,
            maximizable: false,
            closable: false,
            focusable: true,
        };

        return this.createWindow(
            'header',
            options,
            path.join(__dirname, '../../../app/header.html')
        );
    }

    /**
     * Create completion window (results display)
     * @returns {BrowserWindow} The completion window
     */
    createCompletionWindow() {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

        const windowWidth = 600;
        const windowHeight = 400;
        const x = Math.round((screenWidth - windowWidth) / 2);
        const y = Math.round((screenHeight - windowHeight) / 2);

        const options = {
            width: windowWidth,
            height: windowHeight,
            x: x,
            y: y,
            alwaysOnTop: false,
            skipTaskbar: false,
            resizable: false,
            minimizable: true,
            maximizable: false,
            closable: true,
            focusable: true,
        };

        return this.createWindow(
            'completion',
            options,
            path.join(__dirname, '../../../app/completion-window.html')
        );
    }

    /**
     * Transition between assessment windows with fade animation
     * @param {BrowserWindow} fromWindow - Window to transition from
     * @param {Function} toWindowCreator - Function that creates the next window
     */
    transitionToWindow(fromWindow, toWindowCreator) {
        // Fade out current window
        if (fromWindow && !fromWindow.isDestroyed()) {
            fromWindow.webContents.executeJavaScript(`
                document.body.style.transition = 'opacity 0.3s ease-out';
                document.body.style.opacity = '0';
            `);
            
            setTimeout(() => {
                if (fromWindow && !fromWindow.isDestroyed()) {
                    fromWindow.close();
                }
                // Create the new window
                toWindowCreator();
            }, 300);
        } else {
            // Direct creation if no from window
            toWindowCreator();
        }
    }

    /**
     * Get window from pool
     * @param {string} name - Window name
     * @returns {BrowserWindow|null} The window or null if not found
     */
    getWindow(name) {
        return this.windowPool.get(name) || null;
    }

    /**
     * Get all windows in the pool
     * @returns {Map} The window pool
     */
    getAllWindows() {
        return this.windowPool;
    }

    /**
     * Close all windows
     */
    closeAllWindows() {
        this.windowPool.forEach((window, name) => {
            if (window && !window.isDestroyed()) {
                window.close();
            }
        });
        this.windowPool.clear();
    }

    /**
     * Check if a window exists and is not destroyed
     * @param {string} name - Window name
     * @returns {boolean} True if window exists and is valid
     */
    hasWindow(name) {
        const window = this.windowPool.get(name);
        return window && !window.isDestroyed();
    }
}

module.exports = AssessmentWindowManager;