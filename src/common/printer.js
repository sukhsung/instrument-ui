export function make_printer(verbose, filename, colors = true) {
  return function print(msg, level = 1) {
    if (verbose >= level) {
      if (colors) {
        console.log(`\x1b[32m[${filename}]:\x1b[0m \x1b[33m${msg}\x1b[0m`);
      } else {
        console.log(`[${filename}]: ${msg}`);
      }
    }
  };
}
