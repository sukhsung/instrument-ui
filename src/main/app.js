import { app, BrowserWindow, ipcMain } from "electron";
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
