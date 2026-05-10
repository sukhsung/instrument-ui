import { createRequire } from "node:module";
import path from "node:path";

const localRequire = createRequire(import.meta.url);
let cachedSerialPort = null;

function requireFromPackageRoot(rootPath) {
  if (!rootPath) return null;
  return createRequire(path.join(rootPath, "package.json"))("serialport");
}

export function getSerialPort() {
  if (cachedSerialPort) return cachedSerialPort;

  const errors = [];
  const candidates = [
    () => localRequire("serialport"),
    () => requireFromPackageRoot(process.cwd()),
    () => requireFromPackageRoot(process.env.INIT_CWD),
  ];

  for (const load of candidates) {
    try {
      const serialport = load();
      if (serialport?.SerialPort) {
        cachedSerialPort = serialport.SerialPort;
        return cachedSerialPort;
      }
    } catch (error) {
      errors.push(error);
    }
  }

  const message = errors.map((error) => error.message).join("; ");
  throw new Error(`Unable to load serialport dependency: ${message}`);
}
