import { getSerialPort } from "./load_serialport.js";

export async function list_serial_ports() {
  const SerialPort = getSerialPort();
  const ports = await SerialPort.list();
  const validPorts = ports
    .filter((port) => port.productId !== undefined) // Check if PID exist
    .map((port) => port.path); // Return just the path (e.g., "/dev/ttyUSB0")

  return validPorts;
}
