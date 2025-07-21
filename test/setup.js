import { vi } from 'vitest';

// Mock electron for all tests
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/app/path'),
    getName: vi.fn(() => 'Codexel'),
    getVersion: vi.fn(() => '0.2.1')
  },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
    removeHandler: vi.fn()
  },
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    send: vi.fn(),
    removeListener: vi.fn()
  },
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadURL: vi.fn(),
    webContents: {
      send: vi.fn(),
      openDevTools: vi.fn()
    },
    on: vi.fn(),
    once: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    close: vi.fn(),
    isDestroyed: vi.fn(() => false)
  })),
  dialog: {
    showErrorBox: vi.fn(),
    showMessageBox: vi.fn()
  },
  shell: {
    openExternal: vi.fn()
  },
  session: {
    defaultSession: {
      setUserAgent: vi.fn()
    }
  },
  desktopCapturer: {
    getSources: vi.fn()
  }
}));

// Global test utilities
global.createMockWindow = () => ({
  webContents: {
    send: vi.fn()
  },
  isDestroyed: vi.fn(() => false),
  on: vi.fn(),
  once: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  close: vi.fn()
});

global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));