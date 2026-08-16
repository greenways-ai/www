import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("the homepage hero presents an explicit, swipeable artwork carousel", async () => {
  const [layout, home, styles, script] = await Promise.all([
    source("src/layouts/BaseLayout.astro"),
    source("src/pages/index.astro"),
    source("public/manual-hero-carousel.css"),
    source("public/manual-hero-carousel.js")
  ]);

  assert.match(home, /data-world-carousel/);
  assert.match(home, /data-world-slide/);
  assert.match(home, /data-carousel-previous/);
  assert.match(home, /data-carousel-next/);
  assert.match(home, /data-carousel-dot/);
  assert.match(home, /aria-roledescription="carousel"/);

  assert.match(layout, /manualHeroCarousel/);
  assert.match(layout, /manual-hero-carousel\.css/);
  assert.match(layout, /manual-hero-carousel\.js/);

  assert.match(styles, /manual-figure__controls[\s\S]*position:\s*absolute/);
  assert.match(styles, /manual-figure__arrow/);
  assert.match(styles, /manual-figure__dots button\.is-active::after/);
  assert.match(styles, /manualHeroCarouselProgress/);
  assert.match(styles, /touch-action:\s*pan-y pinch-zoom/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);

  assert.match(script, /pointerdown/);
  assert.match(script, /setPointerCapture/);
  assert.match(script, /distanceThreshold/);
  assert.match(script, /next\.click\(\)/);
  assert.match(script, /previous\.click\(\)/);
  assert.match(script, /event\.key === "Home"/);
  assert.match(script, /event\.key === "End"/);
});