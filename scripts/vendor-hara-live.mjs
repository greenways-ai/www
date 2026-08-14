#!/usr/bin/env node
/**
 * Vendor the @hara-lang/live card and the Hara WASM runtime into the site.
 *
 * Sources (resolved from HARA_LANG_ROOT, default ../hara.lang):
 *   website/packages/live/src/*.js,*.css  -> vendor/hara-live/
 *   target/www/runtime/                   -> public/hara-runtime/
 *   docs/docs/javascripts/kernel.js       -> public/hara-runtime/kernel.js
 *   docs/docs/rust/studio/hal/*.hal       -> public/hara-runtime/rust/studio/hal/
 *
 * The runtime is served at /hara-runtime, so absolute "/runtime/" references
 * inside kernel-manifest.json and the docs kernel client are rewritten during
 * the copy. The copy is idempotent: targets are cleaned first.
 *
 * If the hara.lang checkout is unavailable but the targets are already
 * populated (e.g. a deploy build from committed vendored files), the script
 * keeps them and exits 0. If runtime assets can be neither copied nor reused,
 * it exits 1 listing exactly what is missing — the Astro bundle itself does
 * not depend on public/hara-runtime (the card lazy-boots on first Run).
 */
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = fileURLToPath(new URL("..", import.meta.url));
const workspaceRoot = path.resolve(process.env.HARA_WORKSPACE_ROOT ?? path.join(siteRoot, "..", ".."));
const haraRoot = path.join(workspaceRoot, "technology", "hara");
const haraUiRoot = path.join(workspaceRoot, "technology", "hara-ui");
const haraDocsRoot = path.join(workspaceRoot, "website", "hara-docs");

const RUNTIME_BASE = "/hara-runtime";
const vendorDir = path.join(siteRoot, "vendor", "hara-live");
const runtimeDir = path.join(siteRoot, "public", "hara-runtime");

const exists = async (target) => Boolean(await stat(target).catch(() => null));
const copied = [];
const missing = [];
const note = (message) => console.log(`[vendor-hara-live] ${message}`);

/** Copy `files` from `sourceDir` into `targetDir`, recording misses. */
async function copyFiles(sourceDir, files, targetDir, { transform = null, label } = {}) {
  await mkdir(targetDir, { recursive: true });
  let count = 0;
  for (const file of files) {
    const source = path.join(sourceDir, file);
    if (!(await exists(source))) {
      missing.push(`${label}: ${source}`);
      continue;
    }
    const target = path.join(targetDir, file);
    await mkdir(path.dirname(target), { recursive: true });
    if (transform) {
      await writeFile(target, transform(await readFile(source, "utf8")));
    } else {
      await cp(source, target);
    }
    count += 1;
  }
  return count;
}

/** 1. The live card package source (bundled by Astro via relative imports). */
async function vendorLivePackage() {
  const sourceDir = path.join(haraUiRoot, "packages/live/src");
  if (!(await exists(sourceDir))) {
    if (await exists(path.join(vendorDir, "live-card.js"))) {
      note(`hara.lang live package not found at ${sourceDir}; keeping existing vendor/hara-live`);
      return true;
    }
    missing.push(`live package: ${sourceDir}`);
    return false;
  }
  const files = (await readdir(sourceDir)).filter((file) => /\.(js|css)$/.test(file));
  await rm(vendorDir, { recursive: true, force: true });
  const count = await copyFiles(sourceDir, files, vendorDir, { label: "live package" });
  copied.push(`vendor/hara-live (${count} files)`);
  return true;
}

/** 2. The WASM runtime tree the card boots from, served at /hara-runtime. */
async function vendorRuntime() {
  const builtRuntime = path.resolve(
    process.env.HARA_RUNTIME_ROOT ?? path.join(haraRoot, "core", "target", "www", "runtime")
  );
  const runtimeSource = (await exists(path.join(builtRuntime, "kernel-manifest.json")))
    ? builtRuntime
    : null;
  if (!runtimeSource) {
    if (await exists(path.join(runtimeDir, "kernel-manifest.json"))) {
      note(`built runtime not found at ${builtRuntime}; keeping existing public/hara-runtime`);
      return "reused";
    }
    missing.push(
      `runtime tree: ${builtRuntime} (run scripts/build-www in ${haraRoot} to produce it)`
    );
    return false;
  }
  await rm(runtimeDir, { recursive: true, force: true });
  await mkdir(runtimeDir, { recursive: true });
  await cp(runtimeSource, runtimeDir, { recursive: true });
  const entries = await readdir(runtimeDir);
  copied.push(`public/hara-runtime (${entries.length} top-level entries, from target/www/runtime)`);

  // The manifest addresses variants by absolute URL; re-root them.
  const manifestPath = path.join(runtimeDir, "kernel-manifest.json");
  const manifest = await readFile(manifestPath, "utf8");
  await writeFile(manifestPath, manifest.replaceAll('"/runtime/', `"${RUNTIME_BASE}/`));
  note(`rewrote kernel-manifest.json variant URLs to ${RUNTIME_BASE}/`);
  return true;
}

/** 3. The docs kernel client + docs-assets HAL resources it requires. */
async function vendorKernelClient(freshRuntime) {
  if (!(await exists(runtimeDir))) return;
  if (!freshRuntime) {
    // Reused runtime: the client and HAL files are already in place.
    if (!(await exists(path.join(runtimeDir, "kernel.js")))) {
      missing.push(`docs kernel client: ${path.join(haraRoot, "docs/docs/javascripts/kernel.js")}`);
    }
    return;
  }
  const kernelClient = path.join(haraDocsRoot, "docs/javascripts/kernel.js");
  if (await exists(kernelClient)) {
    const source = await readFile(kernelClient, "utf8");
    await writeFile(
      path.join(runtimeDir, "kernel.js"),
      source.replaceAll('"/runtime/', `"${RUNTIME_BASE}/`)
    );
    copied.push("public/hara-runtime/kernel.js (imports re-rooted)");
  } else if (!(await exists(path.join(runtimeDir, "kernel.js")))) {
    missing.push(`docs kernel client: ${kernelClient}`);
  }

  // defaultResources() in the live kernel resolves studio.store/studio.fs
  // from <docsAssetsBase>/rust/studio/hal/.
  const halSource = path.join(haraDocsRoot, "docs/rust/studio/hal");
  const halTarget = path.join(runtimeDir, "rust/studio/hal");
  const halFiles = ["store.hal", "fs.hal"];
  const halCount = await copyFiles(halSource, halFiles, halTarget, { label: "docs hal" });
  if (halCount > 0) copied.push(`public/hara-runtime/rust/studio/hal (${halCount} files)`);
}

const okLive = await vendorLivePackage();
const runtimeResult = await vendorRuntime();
await vendorKernelClient(runtimeResult === true);

for (const entry of copied) note(`copied ${entry}`);
if (missing.length > 0) {
  console.error("[vendor-hara-live] missing assets:");
  for (const entry of missing) console.error(`  - ${entry}`);
  process.exit(1);
}
if (!okLive || !runtimeResult) process.exit(1);
note("done");
