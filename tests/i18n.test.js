"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  DEFAULT_LANGUAGE,
  VI,
  t,
  setLanguage,
  getLanguage,
} = require("../js/i18n.js");
const { PRESETS } = require("../js/presets.js");

const ROOT = path.resolve(__dirname, "..");
const APP_SOURCE = fs.readFileSync(path.join(ROOT, "js", "app.js"), "utf8");
const HTML_SOURCE = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const I18N_SOURCE = fs.readFileSync(path.join(ROOT, "js", "i18n.js"), "utf8");

function decodeAttribute(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

test("Vietnamese is the default language and runs with English as a fallback", () => {
  assert.equal(DEFAULT_LANGUAGE, "vi");
  assert.equal(getLanguage(), "vi");
  assert.equal(t("Block A"), "Khối A");
  assert.equal(t("Unknown key stays unchanged"), "Unknown key stays unchanged");
  assert.equal(
    t("Loaded {cells} cells · {nets} nets", { cells: 12, nets: 15 }),
    "Đã tải 12 cell · 15 net",
  );
});

test("the language switch changes dynamic copy without losing interpolation", () => {
  assert.equal(setLanguage("en"), "en");
  assert.equal(getLanguage(), "en");
  assert.equal(t("Block A"), "Block A");
  assert.equal(
    t("Loaded {cells} cells · {nets} nets", { cells: 12, nets: 15 }),
    "Loaded 12 cells · 15 nets",
  );
  assert.equal(setLanguage("fr"), "en");
  assert.equal(setLanguage("vi"), "vi");
});

test("every preset title, graph name, and graph description is translated", () => {
  for (const preset of PRESETS) {
    const keys = [preset.title, preset.graph.name, preset.graph.description];
    for (const key of keys) {
      assert.ok(
        typeof key !== "string" || key in VI,
        `missing Vietnamese translation for preset text: ${key}`,
      );
    }
  }
});

test("static HTML and direct app.js translation keys all exist", () => {
  const staticKeys = [];
  const attributePattern =
    /data-i18n(?:-html|-title|-aria-label)?="([^"]+)"/g;
  let match;
  while ((match = attributePattern.exec(HTML_SOURCE))) {
    staticKeys.push(decodeAttribute(match[1]));
  }
  for (const key of staticKeys) {
    assert.ok(key in VI, `missing static translation key: ${key}`);
  }

  const appKeys = new Set();
  const directPattern = /\bt\(\s*"((?:\\.|[^"\\])*)"/g;
  while ((match = directPattern.exec(APP_SOURCE))) {
    appKeys.add(match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n"));
  }
  for (const key of appKeys) {
    assert.ok(key in VI, `missing dynamic translation key: ${key}`);
  }
});

test("conditional translation keys and slide terminology are present", () => {
  const requiredKeys = [
    "Internal net; no single-cell move changes its cut status.",
    "cut-critical in both blocks",
    "cut-critical in Block {block}",
    "uncut-critical in Block {block}",
    "{cells} in Block {block}",
    "Lone cell: {list}. Moving it closes the net and contributes +1 to FS.",
    "Lone cells: {list}. Moving either one closes the net and contributes +1 to FS.",
    "Pin distribution A {a} / B {b}",
    "Compute D",
    "Best pair",
    "Swap & lock",
    "Update D",
  ];
  for (const key of requiredKeys) {
    assert.ok(key in VI, `missing conditional translation key: ${key}`);
  }

  assert.match(VI["Critical name"], /then chốt/);
  assert.match(VI["3 · FM: move the best cell"], /cell cơ sở/);
  assert.match(VI["Pin distribution A {a} / B {b}"], /Phân bố pin/);
  assert.match(VI["Pass"], /Lượt/);
  assert.match(VI["Best prefix"], /Chuỗi/);
  assert.match(VI["Cut size"], /kích thước cắt/i);
  assert.match(VI["Fixed for this pass"], /cố định/i);
});

test("the Vietnamese dictionary has no duplicate keys", () => {
  const keys = [];
  const keyPattern = /^\s{4}"((?:\\.|[^"\\])*)"\s*:/gm;
  let match;
  while ((match = keyPattern.exec(I18N_SOURCE))) {
    keys.push(match[1]);
  }
  assert.equal(new Set(keys).size, keys.length, "duplicate Vietnamese key");
});
