const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  showIncomingCall: (payload) => ipcRenderer.send('ciis:incoming-call', payload),
  showNotification: (payload) => ipcRenderer.send('ciis:show-notification', payload),
});
