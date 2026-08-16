import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("the apex site leads with spatial self-publishing", async () => {
  const [config, layout, home] = await Promise.all([
    source("astro.config.mjs"),
    source("src/layouts/BaseLayout.astro"),
    source("src/pages/index.astro")
  ]);

  assert.match(config, /site: "https:\/\/greenways\.ai"/);
  assert.match(home, /Publish a world/);
  assert.match(home, /INDEPENDENT PUBLISHING, MADE SPATIAL/);
  assert.match(home, /THE PUBLISHING PLATFORM/);
  assert.match(home, /ONE CREATIVE ENVIRONMENT/);
  assert.match(home, /THE PROGRAMMABLE STUDIO/);
  assert.match(home, /PUBLISH TO THE OPEN WEB/);
  assert.match(home, /The freedom of Emacs, brought into three dimensions/);
  assert.match(home, /world-workbench/);
  assert.match(home, /publish-edition/);
  assert.match(home, /For the curious/);
  assert.match(home, /https:\/\/oss\.greenways\.ai\//);
  assert.match(home, /Celestial Promenade/);
  assert.match(home, /data-world-carousel/);
  assert.match(home, /world-site-header/);
  assert.doesNotMatch(home, /HaraPlayground/);
  assert.doesNotMatch(home, /@greenways-ai\/visual-language\/SharedHeader\.astro/);
  assert.doesNotMatch(home, /STUDIO WIDGETS|OPEN STANDARDS|We are big in open source/);
  assert.doesNotMatch(home, /A high-trust world for creative work/);
  assert.doesNotMatch(home, /Create together/);
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

test("the early access form remains detectable by Netlify", async () => {
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
  assert.match(component, /Publish your first world/);
  assert.match(component, /Request early access/);
  assert.match(component, /action="\/thank-you\/"/);
  assert.match(component, /netlify-honeypot="bot-field"/);
});

test("the first peacock-theme carousel scenes are available locally", async () => {
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

test("the homepage keeps accessible carousel and motion controls", async () => {
  const [home, styles, publishingStyles] = await Promise.all([
    source("src/pages/index.astro"),
    source("src/styles/world-home.css"),
    source("src/styles/publishing-home.css")
  ]);
  assert.match(home, /aria-roledescription="carousel"/);
  assert.match(home, /aria-live="polite"/);
  assert.match(home, /data-carousel-previous/);
  assert.match(home, /data-carousel-next/);
  assert.match(home, /ArrowLeft/);
  assert.match(home, /ArrowRight/);
  assert.match(home, /aria-label="Preview of the Greenways programmable publishing studio"/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(home, /world-site-header/);
  assert.match(publishingStyles, /world-site-header__nav/);
  assert.match(publishingStyles, /world-workbench__body/);
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
