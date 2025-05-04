/** @file Convert thai-numbers.yaml to an Anki deck. */

import { writeSync, writeFileSync, readFileSync } from "node:fs";
import { load } from "js-yaml";
import { type } from "arktype";
import { parseArgs } from "node:util";

import { AnkiExport } from "./anki-exporter";

// Suppress backtrace and source line printing on error
process.on("uncaughtException", (err) => {
  writeSync(process.stderr.fd, err.stack || err.message);
  process.exitCode = 1;
});

function convertNumbersDeck(inputPath: string, outputPath: string) {
  const entry = type({
    /** Indo-Arabic "123" digits */
    arabic: "string",
    /** Thai digits */
    thai: "string",
    /** Thai name of the number plus IPA */
    pn: "string",
  }).array();

  const data = entry(load(readFileSync(inputPath, { encoding: "utf-8" })));
  if (data instanceof type.errors) {
    throw new Error("There is invalid data in the YAML.");
  }

  const apkg = new AnkiExport("Thai numbers");
  for (const entry of data) {
    apkg.addCard(entry.arabic, entry.thai + "\n\n" + entry.pn);
    apkg.addCard(entry.thai, entry.arabic + "\n\n" + entry.pn);
    apkg.addCard(entry.pn, entry.thai + "\n\n" + entry.arabic);
  }

  apkg.save().then((data) => {
    writeFileSync(outputPath, data, "binary");
    console.log(
      `New deck based on ${inputPath} has been written to ${outputPath}.`,
    );
  });
}

async function main() {
  const parsedArgs = parseArgs({
    args: process.argv.slice(2),
    options: {
      help: { type: "boolean", short: "h" },
      deck: { type: "string", short: "d" },
      input: { type: "string", short: "i" },
      output: { type: "string", short: "o" },
    },
  });

  if (parsedArgs.values.help) {
    console.log(`<convert.ts> -i <input.yaml> -o <output.apkg>

Options:
  --deck: Which deck to generate. Possible choices:
    "numbers": convert using the numbers deck format
    "vowels": convert using the vowels deck format
  --input | -i: Specify input YAML file (required)
  --output | -o: Specify output .apkg file (required)
  --help | -h: Show help (this message)`);
    process.exit(0);
  }
  const { input: inputPath, output: outputPath, deck } = parsedArgs.values;
  if (!(typeof inputPath === "string" && typeof outputPath === "string")) {
    console.log(`Input and output paths must both be specified`);
    process.exit(1);
  }
  const deckOptionSchema = type.enumerated("numbers", "vowels");
  const parsedDeck = deckOptionSchema(deck);
  if (parsedDeck instanceof type.errors) {
    console.log(
      `--deck must be specified and must be a valid option (see --help)`,
    );
    process.exit(1);
  }
  if (parsedDeck === "numbers") {
    convertNumbersDeck(inputPath, outputPath);
  }
}

main();
