import { dialog, shell } from "electron";
import EventEmitter from "node:events";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { COMMON_IPC_CHANNELS } from "../common/ipcChannels.js";

export class LogManager extends EventEmitter {
  constructor(verbose, relativeLogDir) {
    super();
    this.verbose = verbose;
    this.home = os.homedir();
    this.path = path.join(this.home, relativeLogDir, this.get_date());
    this.mkdir(this.path);
    this.fname = null;
    this.api_log = COMMON_IPC_CHANNELS.LOG;
    this.tag = "";
  }

  set_tag(tag) {
    this.tag = tag;
  }

  get_time() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}${minutes}`;
  }

  get_date() {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  async open_path() {
    shell.openPath(this.path);
  }

  async select_dir() {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (result.canceled) return null;

    this.path = path.join(result.filePaths[0], this.get_date());
    this.mkdir(this.path);

    return this.path;
  }

  mkdir(path) {
    this._print("Creating " + path);
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
  }

  _print(message, header = this.constructor.name, color = "y") {
    let col;
    if (color === "r") {
      col = "\x1b[31m";
    } else if (color === "g") {
      col = "\x1b[32m";
    } else {
      col = "\x1b[33m";
    }

    if (this.verbose) {
      message = message.split("\n");

      if (message.length <= 1) {
        console.log("\x1b[32m%s:\x1b[0m %s%s\x1b[0m", header, col, message[0]);
      } else {
        console.log("\x1b[32m%s:\x1b[0m", header);
        message.forEach((m) => {
          console.log("    %s%s\x1b[0m", col, m);
        });
      }
    }
  }
}
