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
  return { __filename, __dirname };
}

export function registerAppHandlers({ version, config, info }) {
  const CH = COMMON_IPC_CHANNELS;
  ipcMain.handle(CH.APP.GET_VERSION, () => version);
  ipcMain.handle(CH.APP.GET_CONFIG,  () => config);
  ipcMain.handle(CH.APP.GET_INFO,    () => info);
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
