import { BaseAdapter } from "./BaseAdapter.js";
import { getSerialPort } from "../util/load_serialport.js";

export class SerialAdapter extends BaseAdapter {
  constructor(protocol, verbose = 0) {
    super(protocol, verbose);
  }

  async _open() {
    const SerialPort = getSerialPort();
    this.device = new SerialPort({
      path: this.protocol.address,
      baudRate: this.protocol.baudRate,
      autoOpen: false,
      lock: false,
    });
    
  }

  flush() {
    if (this.is_open()) {
      this.print("Flushing");
      this.device.flush();
    } else {
      this.print("Device not open, can't flush");
    }
  }

  _close_dev() {
    this.device.close();
  }

}
