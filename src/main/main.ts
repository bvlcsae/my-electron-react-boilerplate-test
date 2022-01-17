/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, autoUpdater } from 'electron';
// import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
console.log = log.log
log.transports.file.level = 'debug';

export default class AppUpdater {
  constructor() {


    // autoUpdater.logger = log;
    // autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));
mainWindow.webContents.openDevTools({mode: 'right'})
  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    // const feedURL = `file://${path.join(__dirname, 'release/build/squirrel-windows/RELEASES')}`
    const feedURL = 'http://113.200.234.211:5050/update/windows_64/1.0.3'
    // const feedURL = 'http://113.200.234.211:5050/download/flavor/default/1.0.3/windows_64/electron-react-boilerplate-1.0.3-full.nupkg'

    console.log(feedURL, 'feedURL')
    autoUpdater.setFeedURL({url: feedURL})
    autoUpdater.on('checking-for-update', () => {
      // 开始检查是否有新版本
      // 可以在这里提醒用户正在查找新版本
      console.log('checking-for-update')
  })
  
  autoUpdater.on('update-available', (info: any) => {
      // 检查到有新版本
      // 提醒用户已经找到了新版本
      console.log('update-available', JSON.stringify(info))
  })
  
  autoUpdater.on('update-not-available', (info: any) => {
      // 检查到无新版本
      // 提醒用户当前版本已经是最新版，无需更新
      console.log('update-not-available', JSON.stringify(info))
  })
  
  autoUpdater.on('error', (err) => {
      // 自动升级遇到错误
      // 执行原有升级逻辑
      console.log('error', JSON.stringify(err))
  })
  
  autoUpdater.on('update-downloaded', (ev, releaseNotes, releaseName) => {
      // 自动升级下载完成
      // 可以询问用户是否重启应用更新，用户如果同意就可以执行 autoUpdater.quitAndInstall()
      console.log('update-downloaded', JSON.stringify(releaseNotes))
  })

  autoUpdater.checkForUpdates();

    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
