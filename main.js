const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Drive de Pobre',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
  });

  // Load the express server that was just started by server.js
  mainWindow.loadURL('http://localhost:3001');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Window control IPC handlers
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow?.close());
  ipcMain.on('window-zoom-in', () => {
    const currentZoom = mainWindow.webContents.getZoomFactor();
    mainWindow.webContents.setZoomFactor(currentZoom + 0.1);
  });
  ipcMain.on('window-zoom-out', () => {
    const currentZoom = mainWindow.webContents.getZoomFactor();
    mainWindow.webContents.setZoomFactor(Math.max(0.1, currentZoom - 0.1));
  });
  ipcMain.on('window-zoom-reset', () => {
    mainWindow.webContents.setZoomFactor(1.0);
  });
  ipcMain.on('open-external-url', (_event, url) => {
    if (typeof url !== 'string' || !/^https?:\/\//.test(url)) return;
    shell.openExternal(url);
    mainWindow?.minimize();
  });
}

app.whenReady().then(() => {
  // Pass the user data directory to the express server so it doesn't write to read-only ASAR
  process.env.USER_DATA_PATH = app.getPath('userData');
  require('./server');
  
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
