/** @file Convert thai-numbers.yaml to an Anki deck. */

import { writeSync, writeFileSync, readFileSync } from "node:fs";
import { load } from "js-yaml";
import { type } from "arktype";
import { parseArgs } from "node:util";

import { AnkiExport, type AnkiExporter } from "./anki-exporter";

// Suppress backtrace and source line printing on error
process.on("uncaughtException", (err) => {
  writeSync(process.stderr.fd, err.stack || err.message);
  process.exitCode = 1;
});

/**
 * Set up an AnkiExport Anki deck for `body` to add cards to, then handle the saving.
 */
function withAnkiDeck(
  name: string,
  inputPath: string,
  outputPath: string,
  body: (apkg: AnkiExporter) => void,
) {
  const apkg = new AnkiExport(name);
  body(apkg);
  apkg.save().then((data) => {
    writeFileSync(outputPath, data, "binary");
    console.log(
      `New deck based on ${inputPath} has been written to ${outputPath}.`,
    );
  });
}

function convertVowelsDeck(inputPath: string, outputPath: string) {
  const entry = type({
    /** Thai vowel */
    thai: "string",
    /** IPA value */
    ipa: "string",
    /** Frequency: 2 = normal, 1 = infrequent, 0 = rare */
    freq: "0 | 1 | 2",
  }).array();

  const data = entry(load(readFileSync(inputPath, { encoding: "utf-8" })));
  if (data instanceof type.errors) {
    throw new Error("There is invalid data in the YAML.");
  }

  withAnkiDeck("Thai vowels", inputPath, outputPath, (apkg) => {
    for (const entry of data) {
      apkg.addCard(entry.thai, "\n\n" + entry.ipa);
    }
  });
}

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
  withAnkiDeck("Thai numbers", inputPath, outputPath, (apkg) => {
    for (const entry of data) {
      apkg.addCard(entry.arabic, entry.thai + "\n\n" + entry.pn);
      apkg.addCard(entry.thai, entry.arabic + "\n\n" + entry.pn);
      apkg.addCard(entry.pn, entry.thai + "\n\n" + entry.arabic);
    }
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
  } else if (parsedDeck === "vowels") {
    convertVowelsDeck(inputPath, outputPath);
  }
}

main();
