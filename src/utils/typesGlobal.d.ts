///<reference path="../../desktop/node_modules/electron/electron.d.ts"/>

declare const ipcRenderer: Electron.IpcRenderer;
// absolute modules path for electronRequire
declare const modulesPath: string;
// tslint:disable-next-line:no-any
declare function __non_webpack_require__(module: string): any;
// tslint:disable-next-line:no-any
declare function electronRequire(module: string): any;

declare var carlo: any;
interface Window {
  riseRelease: string | null;
}
