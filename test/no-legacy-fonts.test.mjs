import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../src/", import.meta.url);

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    return entry.isDirectory() ? files(target) : [target];
  }));
  return nested.flat();
}

test("legacy font families cannot return to site source", async () => {
  const sourceFiles = (await files(root)).filter((file) => /\.(astro|css|ts|js)$/.test(file.pathname));
  const matches = [];
  for (const file of sourceFiles) {
    const content = await readFile(file, "utf8");
    if (/Marcellus/i.test(content)) matches.push(file.pathname);
  }
  assert.deepEqual(matches, []);
});
