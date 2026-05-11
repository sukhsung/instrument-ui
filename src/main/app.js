import { app, BrowserWindow, dialog, ipcMain, Menu, screen } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COMMON_IPC_CHANNELS } from "../common/ipcChannels.js";

export function guardEPIPE() {
  process.stdout.on("error", (err) => {
    if (err.code !== "EPIPE") throw err;
  });
}

export function registerOSSwitches() {
  if (process.platform === "linux")  app.commandLine.appendSwitch("--no-zygote");
  if (process.platform === "darwin") app.commandLine.appendSwitch("--use-mock-keychain");
  app.commandLine.appendSwitch("--password-store", "basic");
}

export function registerApplicationMenu({ includeHelp = true } = {}) {
  if (!app.isPackaged) return;

  const template = [
    ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
    { role: "editMenu" },
    { role: "windowMenu" },
    ...(includeHelp ? [{ role: "help" }] : []),
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

export function resolvePaths(importMetaUrl) {
  const __filename = importMetaUrl;
  const __dirname = path.dirname(fileURLToPath(importMetaUrl));
  const path_src = path.join(__dirname, "..");
  const path_assets = path.join(path_src, "assets");
  const path_renderer = path.join(path_src, "renderer");
  const path_terminal = path.join(path_src, "terminal");

  return {
    __filename,
    __dirname,
    path_src,
    path_preload: path.join(path_src, "preload", "preload.js"),
    path_renderer,
    path_renderer_index: path.join(path_renderer, "index.html"),
    path_terminal,
    path_terminal_index: path.join(path_terminal, "terminal.html"),
    path_assets,
    path_icon: path.join(path_assets, "app-icon.png"),
    path_default_config: path.join(path_assets, "default.config"),
    url_app_ipc_channels: new URL("../common/appIpcChannels.js", importMetaUrl)
      .href,
  };
}

export function registerAppHandlers({ version, config, info }) {
  const CH = COMMON_IPC_CHANNELS;
  ipcMain.handle(CH.APP.GET_VERSION, () => version);
  ipcMain.handle(CH.APP.GET_CONFIG,  () => config);
  ipcMain.handle(CH.APP.GET_INFO,    () => info);
}

export function registerAppLifecycleHandlers() {
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}

export function createAbout({
  applicationName,
  applicationVersion = app.getVersion(),
  copyright,
  credits,
  authors,
}) {
  app.setAboutPanelOptions({
    applicationName,
    applicationVersion,
    copyright,
    credits,
    authors,
  });
}

export function createMainWindow({
  preload,
  renderer,
  icon,
  devMode = false,
  fillWorkArea = true,
  size,
}) {
  if (!fillWorkArea && !size) {
    throw new Error("createMainWindow requires size when fillWorkArea is false");
  }

  const { width, height } = fillWorkArea
    ? screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workAreaSize
    : size;

  const win = new BrowserWindow({
    width,
    height,
    icon,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload,
      devTools: devMode || !app.isPackaged,
      sandbox: true,
      webSecurity: true,
      disableBlinkFeatures: "Auxclick",
    },
  });

  if (!devMode) win.setMenu(null);
  win.loadFile(renderer);

  return win;
}

export function registerMainWindowEvents({
  win,
  icon,
  onClosed,
  confirmTitle = "Confirm",
  confirmMessage = "Are you sure you want to quit?",
}) {
  win.on("close", (e) => {
    const response = dialog.showMessageBoxSync(win, {
      type: "question",
      buttons: ["No", "Yes"],
      icon,
      title: confirmTitle,
      message: confirmMessage,
    });

    if (response == 0) {
      e.preventDefault();
    }
  });

  win.on("closed", async () => {
    if (onClosed) await onClosed();
    app.quit();
  });
}

export function send_to_renderer(win, channel, data) {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, data);
  }
}

export function registerWindowHandlers() {
  const CH = COMMON_IPC_CHANNELS;
  ipcMain.on(CH.WINDOW.MINIMIZE, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });
  ipcMain.on(CH.WINDOW.MAXIMIZE, (event) => {
    const w = BrowserWindow.fromWebContents(event.sender);
    if (w?.isMaximized()) w.unmaximize();
    else w?.maximize();
  });
  ipcMain.on(CH.WINDOW.CLOSE, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });
}
