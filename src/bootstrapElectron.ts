import isElectron from 'is-electron';

if (isElectron()) {
  // expose electron's IPC to the app
  // @ts-ignore
  window.ipcRenderer = __non_webpack_require__('electron').ipcRenderer;
}
