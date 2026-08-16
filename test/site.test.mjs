import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("the apex site reads like a concise publication operating manual", async () => {
  const [config, layout, home] = await Promise.all([
    source("astro.config.mjs"),
    source("src/layouts/BaseLayout.astro"),
    source("src/pages/index.astro")
  ]);

  assert.match(config, /site: "https:\/\/greenways\.ai"/);
  assert.match(home, /OPERATING CARD/);
  assert.match(home, /MAKE\./);
  assert.match(home, /ARRANGE\./);
  assert.match(home, /PUBLISH\./);
  assert.match(home, /USE IN THREE STEPS/);
  assert.match(home, /SELECT PUBLICATION TYPE/);
  assert.match(home, /ONE WORKSPACE/);
  assert.match(home, /PROGRAM THE WORKSPACE/);
  assert.match(home, /RELEASE AN EDITION/);
  assert.match(home, /THE PUBLICATION IS THE PRIMARY OBJECT/);
  assert.match(home, /EMACS PRINCIPLE/);
  assert.match(home, /HARA \/ LISP/);
  assert.match(home, /manual-header/);
  assert.match(home, /manual-panel/);
  assert.match(home, /data-world-carousel/);
  assert.match(home, /https:\/\/oss\.greenways\.ai\//);
  assert.doesNotMatch(home, /Publish a world/);
  assert.doesNotMatch(home, /INDEPENDENT PUBLISHING, MADE SPATIAL/);
  assert.doesNotMatch(home, /The freedom of Emacs, brought into three dimensions/);
  assert.doesNotMatch(home, /Join early access|Explore the studio/);
  assert.doesNotMatch(home, /Your publication should feel like yours/);
  assert.doesNotMatch(home, /HaraPlayground/);
  assert.doesNotMatch(home, /@greenways-ai\/visual-language\/SharedHeader\.astro/);
  assert.match(layout, /immersive\?: boolean/);
  assert.match(layout, /<slot name="header"/);
  assert.match(layout, /<slot name="footer"/);
  assert.doesNotMatch(layout, /www\.greenways\.ai/);
});

test("all four open foundations keep their dedicated routes", async () => {
  const projects = await source("src/data/projects.ts");
  for (const slug of ["hara", "hoplite", "hestia", "historia"]) {
    assert.match(projects, new RegExp(`slug: "${slug}"`));
    const route = await source(`src/pages/opensource/${slug}.astro`);
    assert.match(route, new RegExp(`projectBySlug\\.${slug}`));
  }
  assert.match(projects, /license: "Apache-2\.0"/);
});

test("the access card remains detectable by Netlify", async () => {
  const [component, skeleton] = await Promise.all([
    source("src/components/BetaForm.astro"),
    source("public/__forms.html")
  ]);
  for (const field of [
    "email",
    "interest_music",
    "interest_visual_art",
    "interest_3d",
    "interest_publishing",
    "interest_open_source",
    "consent"
  ]) {
    assert.match(component, new RegExp(`name="${field}"`));
    assert.match(skeleton, new RegExp(`name="${field}"`));
  }
  assert.match(component, /COMPLETE ACCESS CARD/);
  assert.match(component, /SUBMIT CARD/);
  assert.match(component, /Provide email\. Mark intended output\. Submit form\./);
  assert.match(component, /action="\/thank-you\/"/);
  assert.match(component, /netlify-honeypot="bot-field"/);
  assert.doesNotMatch(component, /Publish your first world/);
  assert.doesNotMatch(component, /Tell us what you want to make/);
});

test("the first manual figures are available locally", async () => {
  for (const name of [
    "celestial-promenade-day.webp",
    "celestial-promenade-night.webp",
    "celestial-promenade-day-mobile.webp",
    "celestial-promenade-night-mobile.webp",
    "peacock-garden-day.webp",
    "peacock-garden-night.webp",
    "peacock-garden-day-mobile.webp",
    "peacock-garden-night-mobile.webp"
  ]) {
    const image = await stat(new URL(`public/artwork/greenways/${name}`, root));
    assert.ok(image.size > 100_000, `${name} should be a real artwork asset`);
  }
});

test("the manual carousel remains accessible and motion-aware", async () => {
  const [home, styles] = await Promise.all([
    source("src/pages/index.astro"),
    source("src/styles/publishing-home.css")
  ]);
  assert.match(home, /aria-roledescription="carousel"/);
  assert.match(home, /aria-live="polite"/);
  assert.match(home, /data-carousel-previous/);
  assert.match(home, /data-carousel-next/);
  assert.match(home, /ArrowLeft/);
  assert.match(home, /ArrowRight/);
  assert.match(home, /aria-label="Greenways workspace diagram"/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(styles, /manual-figure__stage/);
  assert.match(styles, /manual-panel__header/);
  assert.match(styles, /IBM Plex Mono/);
  assert.match(styles, /--manual-orange/);
  assert.doesNotMatch(home, /SharedHeader/);
  assert.doesNotMatch(home, /data-world-theme|data-world-menu-toggle/);
});

test("Open Graph metadata stays complete and uses the optimized JPEG cards", async () => {
  const [layout, openSource, projectPage] = await Promise.all([
    source("src/layouts/BaseLayout.astro"),
    source("src/pages/opensource/index.astro"),
    source("src/components/ProjectPage.astro")
  ]);
  assert.match(layout, /og:image:secure_url/);
  assert.match(layout, /og:image:width" content="1200"/);
  assert.match(layout, /og:image:height" content="630"/);
  assert.match(layout, /twitter:image:alt/);
  assert.match(layout, /imageType/);
  assert.match(layout, /og-greenways\.jpg/);
  assert.match(openSource, /og-greenways\.jpg/);
  assert.match(projectPage, /og-\$\{ogName\}\.jpg/);
  assert.doesNotMatch(layout, /og-greenways\.png/);
  assert.doesNotMatch(openSource, /og-greenways\.png/);
  assert.doesNotMatch(projectPage, /og-\$\{ogName\}\.png/);
});
