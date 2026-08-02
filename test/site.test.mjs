import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("the site uses the canonical apex and selected positioning", async () => {
  const [config, layout, home] = await Promise.all([
    source("astro.config.mjs"),
    source("src/layouts/BaseLayout.astro"),
    source("src/pages/index.astro")
  ]);
  assert.match(config, /site: "https:\/\/greenways\.ai"/);
  assert.match(home, /A high-trust world for creative work/);
  assert.match(home, /Create together/);
  assert.match(home, /building a publishing platform/);
  assert.doesNotMatch(home, /Keep what you make/);
  assert.match(home, /Independent foundations/);
  assert.match(home, /One connected world/);
  assert.match(layout, />GREENWAYS</);
  assert.doesNotMatch(layout, /www\.greenways\.ai/);
});

test("all four open foundations have dedicated routes", async () => {
  const projects = await source("src/data/projects.ts");
  for (const slug of ["hara", "hoplite", "hestia", "historian"]) {
    assert.match(projects, new RegExp(`slug: "${slug}"`));
    const route = await source(`src/pages/opensource/${slug}.astro`);
    assert.match(route, new RegExp(`projectBySlug\\.${slug}`));
  }
  assert.match(projects, /license: "EPL-2\.0"/);
  assert.match(projects, /license: "Apache-2\.0"/);
});

test("the early access form has a static Netlify detection copy", async () => {
  const [component, skeleton] = await Promise.all([
    source("src/components/BetaForm.astro"),
    source("public/__forms.html")
  ]);
  for (const field of ["email", "interest_music", "interest_visual_art", "interest_3d", "interest_publishing", "interest_open_source", "consent"]) {
    assert.match(component, new RegExp(`name="${field}"`));
    assert.match(skeleton, new RegExp(`name="${field}"`));
  }
  assert.match(component, /action="\/thank-you\/"/);
  assert.match(component, /netlify-honeypot="bot-field"/);
});

test("the generated hero artwork is present", async () => {
  const image = await stat(new URL("public/assets/greenways-hero.png", root));
  assert.ok(image.size > 100_000);
});

test("WhatsApp Open Graph cards declare 1200 by 630 images", async () => {
  const [layout, openSource, project] = await Promise.all([
    source("src/layouts/BaseLayout.astro"),
    source("src/pages/opensource/index.astro"),
    source("src/components/ProjectPage.astro")
  ]);
  assert.match(layout, /og:image:secure_url/);
  assert.match(layout, /og:image:width" content="1200"/);
  assert.match(layout, /og:image:height" content="630"/);
  assert.match(layout, /twitter:image:alt/);
  assert.match(layout, /og:image:type" content="image\/jpeg"/);
  assert.match(layout, /\/assets\/og-greenways-whatsapp\.jpg/);
  assert.match(openSource, /\/assets\/og-opensource-whatsapp\.jpg/);
  assert.match(project, /\/assets\/og-opensource-whatsapp\.jpg/);
  for (const name of ["og-greenways-whatsapp.jpg", "og-opensource-whatsapp.jpg"]) {
    const image = await stat(new URL(`public/assets/${name}`, root));
    assert.ok(image.size > 100_000);
    assert.ok(image.size < 320_000);
  }
});
