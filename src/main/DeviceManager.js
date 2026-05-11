import { EventEmitter } from "node:events";
import { ConnectionManager } from "./connection/ConnectionManager.js";
import { make_printer } from "./util/printer.js";

export class DeviceManager extends EventEmitter {
  constructor(device_info, verbose = 0) {
    super();
    this.verbose = verbose;
    this.print = make_printer(verbose, this.constructor.name);
    this.device_info = device_info;

    this.connection_manager = new ConnectionManager(verbose);
    this.protocol = null;
    this.connected = false;
    this.default_timeout = 50;
    this.device = null;

    this.t_interval = null; // in ms

    this.reset_request();
    this._stoppedResolve = null;
    this._stopped = Promise.resolve(); // initial resolved
    this.running = false;

    this.api_device = null;
  }

  is_connected() {
    const connected = this.connected;
    const protocol = this.protocol;
    return { connected: connected, protocol: protocol };
  }

  emit_status(data) {
    this.emit(this.api_device.EVT_STATUS, data);
  }

  emit_settings(data) {
    this.emit(this.api_device.EVT_SETTINGS, data);
  }

  emit_connection() {
    const device_info = this.device_info;
    const protocol = this.protocol;
    const connected = this.connected;

    if (this.api_device) {
      this.emit(this.api_device.EVT_CONNECTION, {
        device_info: device_info,
        connected: connected,
        protocol: protocol,
      });
    }
  }

  async _connect(protocol) {
    return true;
  }

  async fail_connect() {
    this.connected = false;
    if (this.device?.is_open()) {
      await this.device.close();
    }
    this.connection_manager.adapter = null;
    this.protocol = null;
    this.device = null;
    this.t_interval = null;
    this.emit_connection();
  }

  // Connection Logic
  async connect(protocol) {
    this.connected = false;

    // Try Opening Connection
    await this.connection_manager.open(protocol, 1);
    if (!this.connection_manager.is_open()) {
      this.protocol = null;
      this.device = null;
      this.emit_connection();
      return;
    }
    this.device = this.connection_manager.adapter;
    this.protocol = protocol;
    this.encoding = protocol.encoding;
    this.delimiter = protocol.delimiter;

    if (!(await this._connect(protocol))) {
      await this.fail_connect();
      return;
    }

    // If Open wait 500 ms then validate device
    // await this.sleep(500);
    if (await this.check_device()) {
      this.print("Connected to valid device");
      this.connected = true;
      this.protocol = protocol;
      this.t_interval = protocol.t_interval;
      await this.init_device();
      this.emit_connection();
    } else {
      this.print("Connected device failed validation");
      await this.fail_connect();
    }
  }

  // Disconnect Logic
  async disconnect() {
    this.print("Disconnecting");
    if (this.connected && this.device) {
      await this.prepare_disconnect();
      const device = this.device;
      this.connected = false;
      this.device = null;
      this.protocol = null;
      await device.close();
    } else {
      this.connected = false;
      this.device = null;
      this.protocol = null;
    }
    this.emit_connection();
  }

  // Communication Logic

  async start_comm() {
    this.print("Starting Comm");
    if (this.running) return; // guard reentrancy
    this.running = true;
    this.requests = [];

    // create a promise that resolves when we stop
    this._stopped = new Promise((r) => (this._stoppedResolve = r));

    try {
      while (this.running) {
        if (this.requests.length === 0) {
          await this.process_regular();
          // optional: check running again before sleeping
          if (!this.running) break;
          await this.sleep(this.t_interval);
        } else {
          await this.process_request();
        }
      }
    } catch (err) {
      // log/handle as appropriate
      this.log?.("Comm error: " + ((err && err.message) || err));
      // decide whether to rethrow or swallow
    } finally {
      this.log?.("Comm Stopped");
      this._stoppedResolve?.(); // unblock stop_comm()
      this._stoppedResolve = null;
    }
  }

  async stop_comm() {
    this.running = false;
    this.requests = [];
    // Await the loop finishing without polling
    await this._stopped;
  }

  // Request Logics
  reset_request() {
    this._idx_req = 0;
    this.requests = [];
  }

  add_to_requests(request) {
    const idx = this._idx_req;
    this.requests.push({ index: idx, request: request });
    this._idx_req++;
  }

  async process_request() {
    this.print("Processing Request");
    const request = this.requests.shift();
    this.print(request);
    await this._process_request(request);
  }

  async _process_request(req) {
    this.print("Processing Request");
    return;
  }

  async process_regular() {
    await this._process_regular();
  }

  async _process_regular() {
    this.print("Processing Regular");
    return;
  }

  async init_device() {
    this.print("Initializing device...");
    this.register_event_handlers();
    await this._init_device();
    return;
  }

  async _init_device() {
    return true;
  }

  async prepare_disconnect() {
    this.print("Preparing to Disconnect");
    await this._prepare_disconnect();
    await this.stop_comm();
  }

  async on_port_close() {
    this.print("Received Port Closed");
    this.close();
  }

  async close() {
    this.print("Closing");
    await this.disconnect();
    return;
  }

  async register_event_handlers() {
    const device = this.device;

    device.on("open", async (msg) => {
      if (msg.open === false) {
        await this.on_port_close();
      }
    });

    device.on("closed", () => {
      this.running = false;
      if (this.device !== device && !this.connected) return;
      this.connected = false;
      this.device = null;
      this.protocol = null;
      this.emit_connection();
    });
  }

  async read() {
    // read everything then decode
    const msg = (await this.device.read_all()).toString(this.encoding);
    return msg;
  }

  async write(msg) {
    await this.device.write(msg + this.delimiter);
  }

  async query(msg) {
    await this.write(msg);
    return await this.read();
  }

  async query_s(msg) {
    // return delimiter stripped, single line response
    // assume a single line respone
    return (await this.query(msg)).split(this.delimiter)[0];
  }

  async check_device() {
    this.print("Checking for valid device");
    const isValid = await this._check_device();
    this.print(`Device Validity: ${isValid}`);
    return isValid;
  }

  async _check_device() {
    return true;
  }

  async _write_buffer(buffer) {
    this.device.write(buffer);
  }

  async sleep(ms) {
    // this.print(`Sleeping for ${ms} ms`, 2);
    return await new Promise((res) => setTimeout(res, ms));
  }

}
