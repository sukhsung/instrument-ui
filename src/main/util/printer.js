export function make_printer(verbose, filename) {
  return function print(msg, level = 1) {
    if (verbose >= level) {
      console.log(`\x1b[32m[${filename}]:\x1b[0m \x1b[33m${msg}\x1b[0m`);
    }
  };
}
