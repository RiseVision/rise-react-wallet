const { app, BrowserWindow, webFrame } = require('electron');
// run the ledger hub and expose over IPC
require('./ledgerIPC');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    // TODO only for testing
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  });

  // TODO only for testing
  mainWindow.webContents.openDevTools();
  // TODO only for testing
  mainWindow.loadURL('https://localhost:3000');
  // mainWindow.loadFile('app/index.html')

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// https://stackoverflow.com/questions/38986692/
//   how-do-i-trust-a-self-signed-certificate-from-an-electron-app
// SSL/TSL: this is the self signed certificate support
app.on(
  'certificate-error',
  (event, webContents, url, error, certificate, callback) => {
    // On certificate error we disable default behaviour (stop loading the page)
    // and we then say "it is all fine - true" to the callback
    event.preventDefault();
    callback(true);
  }
);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
