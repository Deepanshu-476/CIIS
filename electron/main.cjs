const { app, BrowserWindow, Notification, ipcMain, net, protocol } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const isDev = !app.isPackaged;
const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const appScheme = 'app';
const remoteDebugPort = process.env.CIIS_REMOTE_DEBUG_PORT;
let mainWindow;

if (remoteDebugPort) {
  app.commandLine.appendSwitch('remote-debugging-port', remoteDebugPort);
  app.commandLine.appendSwitch('remote-allow-origins', '*');
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: appScheme,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

function resolveDistPath(requestUrl) {
  const distRoot = path.join(__dirname, '..', 'dist');
  const url = new URL(requestUrl);
  const requestedPath = decodeURIComponent(url.pathname);
  const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.slice(1);
  const filePath = path.normalize(path.join(distRoot, relativePath));

  if (!filePath.startsWith(distRoot)) {
    return path.join(distRoot, 'index.html');
  }

  return fs.existsSync(filePath) ? filePath : path.join(distRoot, 'index.html');
}

function registerAppProtocol() {
  protocol.handle(appScheme, (request) => {
    const filePath = resolveDistPath(request.url);
    return net.fetch(pathToFileURL(filePath).toString());
  });
}

function createMainWindow() {
  const iconPath = isDev
    ? path.join(__dirname, '..', 'public', 'logoo.png')
    : path.join(__dirname, '..', 'dist', 'logoo.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    icon: iconPath,
    show: false,
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: isDev,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    mainWindow.loadURL(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowedOrigins = [
      devServerUrl,
      `${appScheme}://ciis`,
    ].filter(Boolean).map((value) => new URL(value).origin);

    if (!allowedOrigins.includes(new URL(url).origin)) {
      event.preventDefault();
      mainWindow.loadURL(url);
    }
  });

  if (isDev && devServerUrl) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadURL(`${appScheme}://ciis/`);
  }
}

ipcMain.on('ciis:incoming-call', (_event, payload = {}) => {
  const callerName = payload.callerName || 'User';
  const title = payload.title || 'Incoming call';
  const body = payload.body || `${callerName} is calling`;

  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();

    if (process.platform === 'win32') {
      mainWindow.flashFrame(true);
    }
  }

  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      silent: false,
    });

    notification.on('click', () => {
      if (!mainWindow) return;
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      if (process.platform === 'win32') {
        mainWindow.flashFrame(false);
      }
    });

    notification.show();
  }
});

app.whenReady().then(() => {
  registerAppProtocol();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  mainWindow = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
