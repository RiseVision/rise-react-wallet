import * as carlo from 'carlo';
import * as os from 'os';
import * as path from 'path';
import 'dotenv';

async function run() {
  let app;
  try {
    app = await carlo.launch({
      bgcolor: '#2b2e3b',
      title: 'RISE Wallet',
      width: 1000,
      height: 800,
      channel: ['canary', 'stable'],
      icon: path.join(__dirname, '/../build/icon-64.png'),
      args: process.env.DEV === 'true' ? ['--auto-open-devtools-for-tabs'] : [],
      localDataDir: path.join(os.homedir(), '.risewallet')
    });
  } catch (e) {
    console.log(e);
    // New window is opened in the running instance.
    console.log('Reusing the running instance');
    return;
  }
  app.on('exit', () => process.exit());
  // New windows are opened when this app is started again from command line.
  app.serveFolder(path.join(__dirname, '..', 'build'));
  app.on('window', window => window.load('index.html'));
  await app.load('index.html', process.env.RELEASE);

  return app;
}
run();
