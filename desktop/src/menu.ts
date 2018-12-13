import { Menu, shell } from 'electron';
import { observe } from 'mobx';
import { defineMessages } from 'react-intl';
import LangStore from './lang';

const messages = defineMessages({
  edit: {
    id: 'desktop-menu.edit',
    description: 'Edit menu',
    defaultMessage: 'Edit'
  },
  view: {
    id: 'desktop-menu.view',
    description: 'View menu',
    defaultMessage: 'dasdasdasd'
  },
  learnMode: {
    id: 'desktop-menu.learn-more',
    description: 'Menu Help - Learn More',
    defaultMessage: 'Learn More'
  },
  riseWallet: {
    id: 'desktop-menu.rise-wallet',
    description: 'First menu on MacOS, app title',
    defaultMessage: 'RISE Wallet'
  }
});

function getTemplate(lang: LangStore) {
  const template = [
    {
      label: lang.get(messages.edit),
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    },
    {
      label: lang.get(messages.view),
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      role: 'window',
      submenu: [{ role: 'minimize' }, { role: 'close' }]
    },
    {
      role: 'help',
      submenu: [
        {
          label: lang.get(messages.learnMode),
          click() {
            shell.openExternal('https://rise.vision');
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: lang.get(messages.riseWallet),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Edit menu
    // @ts-ignore
    template[1].submenu.push(
      { type: 'separator' },
      {
        label: 'Speech',
        submenu: [
          {
            role: 'startspeaking'
          },
          { role: 'stopspeaking' }
        ]
      }
    );

    // Window menu
    template[3].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  return template;
}

export function buildMenus(lang: LangStore) {
  // rebuild menus when the lang changes
  observe(lang, 'locale', () => {
    // @ts-ignore
    const menu = Menu.buildFromTemplate(getTemplate(lang));
    Menu.setApplicationMenu(menu);
  });
  // @ts-ignore
  const menu = Menu.buildFromTemplate(getTemplate(lang));
  Menu.setApplicationMenu(menu);
}
