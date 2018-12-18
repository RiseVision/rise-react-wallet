// tslint:disable

'use strict';

const carlo = require('carlo');
const os = require('os');
const path = require('path');

async function run() {
  let app;
  try {
    app = await carlo.launch(
      {
        bgcolor: '#2b2e3b',
        title: 'RISE',
        width: 1000,
        height: 500,
        channel: ['canary', 'stable'],
        icon: path.join(__dirname, '/build/icon-64.png'),
        args: process.env.DEV === 'true' ? ['--auto-open-devtools-for-tabs'] : [],
        localDataDir: path.join(os.homedir(), '.carlosysteminfo'),

      });
  } catch(e) {
    console.log(e);
    // New window is opened in the running instance.
    console.log('Reusing the running instance');
    return;
  }
  app.on('exit', () => process.exit());
  // New windows are opened when this app is started again from command line.
  app.serveFolder(path.join(__dirname, 'build'));
  app.on('window', window => window.load('index.html'));
  // await app.exposeFunction('systeminfo', systeminfo);
  await app.load('index.html');
  return app;
}

run();
