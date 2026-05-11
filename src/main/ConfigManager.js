import { app } from "electron";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

export function load_config(defaultConfigPath) {
  const appName = app.getName();
  const CONFIG_DIR = path.join(os.homedir(), appName);
  const CONFIG_PATH = path.join(CONFIG_DIR, `${appName}.config`);

  function load_default() {
    return JSON.parse(fs.readFileSync(defaultConfigPath, "utf-8"));
  }

  if (!fs.existsSync(CONFIG_PATH)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.copyFileSync(defaultConfigPath, CONFIG_PATH);
    return load_default();
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return load_default();
  }
}
