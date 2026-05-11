import { EventEmitter } from "node:events";
import { make_printer } from "../util/printer.js";

export class BaseAdapter extends EventEmitter {
  constructor(protocol, verbose = 0) {
    super();

    this.verbose = verbose;
    this.print = make_printer(verbose, this.constructor.name);
    this.protocol = protocol;
    this.encoding = protocol.encoding;
    this.delimiter = protocol.delimiter;
    this.timeout = 100;
    this.device = null;

    this._buffer = Buffer.alloc(0);
    this._readResolvers = [];
    this._closing = null;
  }

  set_timeout(timeout) {
    this.timeout = timeout;
  }

  is_open() {
    return !!this.device?.isOpen;
  }

  async open() {
    if (this.is_open()) {
      this.print("Connection already open");
      return;
    }

    this.print("Opening");

    await this._open();
    this.device.on("open", () => this._on_open());
    this.device.on("data", (chunk) => this._on_data(chunk));
    this.device.on("close", () => this._on_close());
    this.device.on("error", (err) => {
      this.print(err.message);
    });

    this.device.open();
    await this.sleep(100);
  }

  async close() {
    if (this._closing) return await this._closing;
    if (!this.is_open()) {
      this.device = null;
      return;
    }

    this._closing = new Promise((resolve) => {
      const timer = setTimeout(resolve, 1000);
      timer.unref?.();
      this.once("closed", () => {
        clearTimeout(timer);
        resolve();
      });
    });
    this._close_dev();
    await this._closing;
    this._closing = null;
  }

  flush() {
    throw new Error(
      `[${this.constructor.name}]: flush() not defined`,
    );
  }

  async write(msg) {
    let buf;
    if (typeof msg === "string") {
      buf = Buffer.from(msg, this.encoding);
    } else if (Buffer.isBuffer(msg)) {
      buf = msg;
    } else {
      throw new Error(`[BaseAdapter]: write() expects String or Buffer`);
    }
    await this.device.write(buf);
  }

  read(size) {
    return new Promise((resolve) => {
      if (this._buffer.length >= size) {
        const chunk = this._buffer.slice(0, size);
        this._buffer = this._buffer.slice(size);
        return resolve(chunk);
      }

      const timeoutId = setTimeout(() => {
        this._readResolvers = this._readResolvers.filter(
          (r) => r.resolve !== wrappedResolve,
        );
        const partial = this._buffer;
        this._buffer = Buffer.alloc(0);
        this.print(`read timeout: returning partial data ${partial.length}/${size} bytes`);
        resolve(partial);
      }, this.timeout);

      const wrappedResolve = (data) => {
        clearTimeout(timeoutId);
        resolve(data);
      };

      this._readResolvers.push({ size, resolve: wrappedResolve });
    });
  }

  read_all(timeout = this.timeout) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = this._buffer;
        this._buffer = Buffer.alloc(0);
        resolve(result);
      }, timeout);
    });
  }

  read_until(target, timeout = this.timeout) {
    if (!Buffer.isBuffer(target)) {
      target = Buffer.from(target, this.encoding);
    }

    return new Promise((resolve, reject) => {
      const check = () => {
        const idx = this._buffer.indexOf(target);
        if (idx !== -1) {
          const end = idx + target.length;
          const out = this._buffer.slice(0, end);
          this._buffer = this._buffer.slice(end);
          resolve(out);
          return true;
        }
        return false;
      };

      if (check()) return;

      const timeoutId = setTimeout(() => {
        reject(
          new Error(`read_until timeout: never found "${target.toString()}"`),
        );
      }, timeout);

      const poll = () => {
        if (check()) {
          clearTimeout(timeoutId);
        } else {
          setTimeout(poll, 5);
        }
      };

      poll();
    });
  }

  _on_open() {
    this.print("Open");
    this.flush();
  }

  _on_data(chunk) {
    this._buffer = Buffer.concat([this._buffer, chunk]);

    // Resolve any waiting read(size) promises if enough data has arrived
    this._readResolvers = this._readResolvers.filter(({ size, resolve }) => {
      if (this._buffer.length >= size) {
        const result = this._buffer.slice(0, size);
        this._buffer = this._buffer.slice(size);
        resolve(result);
        return false; // remove from list
      }
      return true;
    });
  }

  _on_close() {
    this.print("Connection closed");
    for (const { resolve } of this._readResolvers) {
      resolve(Buffer.alloc(0));
    }
    this._readResolvers = [];
    this._buffer = Buffer.alloc(0);
    this.emit("closed");
    this.device = null;
  }

  async sleep(ms) {
    this.print(`Sleeping for ${ms} ms`, 2);
    return await new Promise((res) => setTimeout(res, ms));
  }
}
