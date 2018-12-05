// ignore `require` by webpack, without having the access to the config
if (typeof global === 'object') {
  // fix the naming
  __non_webpack_require__ = require
  // expose electron's IPC to the app
  window.ipcRenderer = require('electron').ipcRenderer
}
