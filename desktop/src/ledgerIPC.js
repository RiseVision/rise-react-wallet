// @ts-check

const { LedgerHub } = require('../ledgerHub/ledgerHub');
const { ipcMain } = require('electron');

// expose IPC globally on the main thread
global.ipcMain = ipcMain

const hub = new LedgerIPCServer();
