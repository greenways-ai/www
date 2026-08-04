import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("the apex site leads with connected-world builders", async () => {
  const [config, layout, home] = await Promise.all([
    source("astro.config.mjs"),
    source("src/layouts/BaseLayout.astro"),
    source("src/pages/index.astro")
  ]);

  assert.match(config, /site: "https:\/\/greenways\.ai"/);
  assert.match(home, /Anyone can build a world/);
  assert.match(home, /BUILD CONNECTED WORLDS/);
  assert.match(home, /STUDIO WIDGETS/);
  assert.match(home, /OPEN STANDARDS/);
  assert.match(home, /We are big in open source/);
  assert.match(home, /https:\/\/oss\.greenways\.ai\//);
  assert.match(home, /Celestial Promenade/);
  assert.match(home, /data-world-carousel/);
  assert.match(home, /data-world-theme/);
  assert.doesNotMatch(home, /A high-trust world for creative work/);
  assert.doesNotMatch(home, /Create together/);
  assert.doesNotMatch(home, /THE CELESTIAL WORLD|One atelier|Many forms/);
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
  assert.match(projects, /license: "EPL-2\.0"/);
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
  assert.match(component, /Build your first experience/);
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
  const home = await source("src/pages/index.astro");
  const styles = await source("src/styles/world-home.css");
  assert.match(home, /aria-roledescription="carousel"/);
  assert.match(home, /aria-live="polite"/);
  assert.match(home, /data-carousel-previous/);
  assert.match(home, /data-carousel-next/);
  assert.match(home, /ArrowLeft/);
  assert.match(home, /ArrowRight/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(home, /GreenwaysTheme/);
});

test("Open Graph metadata stays complete", async () => {
  const layout = await source("src/layouts/BaseLayout.astro");
  assert.match(layout, /og:image:secure_url/);
  assert.match(layout, /og:image:width" content="1200"/);
  assert.match(layout, /og:image:height" content="630"/);
  assert.match(layout, /twitter:image:alt/);
  assert.match(layout, /og:image:type" content="image\/png"/);
  assert.match(layout, /og-greenways\.png/);
});
