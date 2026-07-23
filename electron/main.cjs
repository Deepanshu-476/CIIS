const { app, BrowserWindow, Notification, ipcMain, net, protocol, session, Tray, Menu } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const isDev = !app.isPackaged;
const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const appScheme = 'app';
const backendRequestFilter = {
  urls: [
    'https://backendcds.ciisnetwork.in/*',
    'wss://backendcds.ciisnetwork.in/*',
  ],
};
const remoteDebugPort = process.env.CIIS_REMOTE_DEBUG_PORT;
let mainWindow;
let tray;
let isQuitting = false;

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
}

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

function isAllowedAppOrigin(origin) {
  if (!origin) return false;

  let parsedOrigin;
  try {
    parsedOrigin = new URL(origin).origin;
  } catch {
    return false;
  }

  const allowedOrigins = [
    devServerUrl,
    `${appScheme}://ciis`,
  ].filter(Boolean).map((value) => new URL(value).origin);

  return allowedOrigins.includes(parsedOrigin);
}

function configureDesktopPermissions() {
  const allowedPermissions = new Set([
    'audioCapture',
    'videoCapture',
    'media',
    'mediaKeySystem',
    'notifications',
    'geolocation',
  ]);

  session.defaultSession.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => (
    allowedPermissions.has(permission) && isAllowedAppOrigin(requestingOrigin)
  ));

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details = {}) => {
    const requestingOrigin = details.requestingOrigin || webContents.getURL();
    callback(allowedPermissions.has(permission) && isAllowedAppOrigin(requestingOrigin));
  });
}

function configureBackendRequestHeaders() {
  session.defaultSession.webRequest.onBeforeSendHeaders(backendRequestFilter, (details, callback) => {
    const requestHeaders = { ...details.requestHeaders };

    delete requestHeaders.Origin;
    delete requestHeaders.origin;

    callback({ requestHeaders });
  });
}

function getIconPath() {
  return isDev
    ? path.join(__dirname, '..', 'public', 'logoo.png')
    : path.join(__dirname, '..', 'dist', 'logoo.png');
}

function showMainWindow() {
  if (!mainWindow) {
    createMainWindow();
    return;
  }

  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();

  if (process.platform === 'win32') {
    mainWindow.flashFrame(false);
  }
}

function createTray() {
  if (tray) return;

  tray = new Tray(getIconPath());
  tray.setToolTip('CIIS Network');
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Open CIIS Network',
      click: showMainWindow,
    },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]));
  tray.on('double-click', showMainWindow);
}

function configureAutoLaunch() {
  if (isDev || process.platform !== 'win32') return;

  app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath,
  });
}

function createMainWindow() {
  const iconPath = getIconPath();

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

  mainWindow.on('close', (event) => {
    if (isQuitting) return;

    event.preventDefault();
    mainWindow.hide();

    if (process.platform === 'win32') {
      mainWindow.setSkipTaskbar(true);
    }
  });

  mainWindow.on('show', () => {
    if (process.platform === 'win32') {
      mainWindow.setSkipTaskbar(false);
    }
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
    showMainWindow();

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
      showMainWindow();
    });

    notification.show();
  }
});

ipcMain.on('ciis:show-notification', (_event, payload = {}) => {
  const title = payload.title || 'CIIS Network';
  const body = payload.body || payload.message || 'You have a new notification';

  if (!Notification.isSupported()) return;

  const notification = new Notification({
    title,
    body,
    silent: false,
  });

  notification.on('click', () => {
    showMainWindow();
  });

  notification.show();
});

app.whenReady().then(() => {
  registerAppProtocol();
  configureDesktopPermissions();
  configureBackendRequestHeaders();
  configureAutoLaunch();
  createTray();
  createMainWindow();

  app.on('activate', () => {
    showMainWindow();
  });
});

app.on('second-instance', () => {
  showMainWindow();
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (isQuitting) {
    mainWindow = null;
  }
});
