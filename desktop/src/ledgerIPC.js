// @ts-check

// force webpack to ignore specifci `require` calls
// without having the access to the config, by using `__non_webpack_require__`
__non_webpack_require__ = require

require('@babel/polyfill');
const { LedgerIPCServer } = require('../ledgerHub/ledgerHub');
const { ipcMain } = require('electron');

// expose IPC globally on the main thread
global.ipcMain = ipcMain;

const hub = new LedgerIPCServer();
