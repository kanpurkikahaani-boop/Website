// The browser bundle of mammoth has the same API as the main entry.
declare module "mammoth/mammoth.browser" {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- type-only alias of a CommonJS module
  import mammoth = require("mammoth");
  export = mammoth;
}
