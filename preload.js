
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  quitApplication: () => ipcRenderer.invoke('quit-application'),
  // Add other APIs you need to expose here
});
