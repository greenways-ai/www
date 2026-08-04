import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("the site consumes the visual language typography contract", async () => {
  const [pkg, layout, typography, worldTypography] = await Promise.all([
    source("package.json"),
    source("src/layouts/BaseLayout.astro"),
    source("src/styles/typography.css"),
    source("src/styles/world-typography.css"),
  ]);

  assert.match(pkg, /@fontsource\/bodoni-moda/);
  assert.doesNotMatch(pkg, /@fontsource\/marcellus/);
  assert.match(layout, /@fontsource\/bodoni-moda\/400\.css/);
  assert.match(layout, /@greenways-ai\/visual-language\/typography\.css/);
  assert.match(layout, /world-typography\.css/);
  assert.match(typography, /--display: var\(--gw-font-display/);
  assert.match(typography, /--sans: var\(--gw-font-sans/);
  assert.match(typography, /--mono: var\(--gw-font-mono/);
  assert.match(worldTypography, /Bodoni Moda/);
  assert.match(worldTypography, /font-weight: 400 !important/);
});
