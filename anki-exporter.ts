// Write my own types for this thing
declare interface AddCardOptions {
  tags: string[];
}
declare class AnkiExporter {
  constructor(deckName: string);
  addMedia(path: string, data: string | Buffer): void;
  addCard(front: string, back: string, options?: AddCardOptions): void;
  save(): Promise<string | NodeJS.ArrayBufferView>;
}

/* HACK: anki-apkg-export triggers this sql.js warning:
 *
 * > writeStringToMemory is deprecated and should not be called! Use
 * > stringToUTF8() instead!
 *
 * Since it's outside of my control (it's anki-apkg-export that needs to address
 * it, not me), I'd like to suppress it.
 *
 * The message comes from sql.js/js/sql-debug.js, which uses warnOnce, which
 * uses Emscripten's Module.printErr, which is defined to be console.warn in
 * Node (and therefore also in Bun). By redefining console.warn to no-op before
 * requiring and resetting it afterwards, we can make sure that the imported
 * copy of sql.js sees the no-op instead.
 */
const origWarn = console.warn;
console.warn = () => {};

export const AnkiExport = require("anki-apkg-export")
  .default as typeof AnkiExporter;

console.warn = origWarn;
