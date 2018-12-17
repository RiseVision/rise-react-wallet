// @ts-check

import { app, BrowserWindow, ipcMain } from 'electron';
import { buildMenus } from './menu';
import LangStore from './lang';
import serve from './serve';

const lang = new LangStore();

// serve only in production
if (process.env.NODE_ENV !== 'development') {
  serve();
}

exposeModulesPath();

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    // required for NODE_ENV=development
    ...(process.env.NODE_ENV === 'development'
      ? {
          webPreferences: {
            webSecurity: false,
            allowRunningInsecureContent: true
          }
        }
      : null)
  });

  if (process.env.NODE_ENV === 'development') {
    // load the local instance
    // mainWindow.webContents.openDevTools();
    mainWindow.loadURL('https://localhost:3000');
  } else {
    // mainWindow.webContents.openDevTools();
    mainWindow.loadURL('http://localhost:5000');
  }

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  buildMenus(lang);
}

let mainWindow: BrowserWindow | null;

app.on('ready', createWindow);

// required for NODE_ENV=development
app.on(
  'certificate-error',
  (event, webContents, url, error, certificate, callback) => {
    // On certificate error we disable default behaviour (stop loading the page)
    // and we then say "it is all fine - true" to the callback
    event.preventDefault();
    callback(true);
  }
);

app.on('window-all-closed', function() {
  app.quit();
});

app.on('activate', function() {
  if (mainWindow === null) {
    createWindow();
  }
});

function exposeModulesPath() {
  let nodeModDir = require.resolve('express');
  const dirnm = 'node_modules';
  const pos = nodeModDir.lastIndexOf(dirnm);
  if (pos != -1) {
    nodeModDir = nodeModDir.substr(0, pos + dirnm.length + 1);
  }

  ipcMain.on('modules-path', (event: { returnValue: string }) => {
    event.returnValue = nodeModDir;
  });
}
