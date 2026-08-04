import { HtaContext } from "/hara-runtime/hta.js?v=20260803-modular-kernel";
import { createHostServices } from "/hara-runtime/studio/host-services.js";

export function prepareDocsEval(source) {
  if (/^\(\s*fn(?:\s|\[)/.test(source.trim())) {
    return {
      source: `(do ${source}\n nil)`,
      label: "<function>"
    };
  }
  return { source, label: null };
}

/**
 * A browser-local Hara kernel for documentation snippets. It exposes the
 * Studio's persistent browser store and virtual filesystem, but no workspace
 * UI or ambient device capabilities.
 */
async function loadKernelAssets(wasmUrl, resources, fetchAsset) {
  const entries = Object.entries(resources);
  const [response, ...resourceResponses] = await Promise.all([
    fetchAsset(wasmUrl),
    ...entries.map(([, url]) => fetchAsset(url))
  ]);
  if (!response.ok) throw new Error(`hara.wasm: ${response.status}`);
  const moduleBytes = await response.arrayBuffer();
  const loadedResources = await Promise.all(resourceResponses.map(async (resourceResponse, index) => {
    const [name] = entries[index];
    if (!resourceResponse.ok) throw new Error(`${name}: ${resourceResponse.status}`);
    return [name, await resourceResponse.text()];
  }));
  return { moduleBytes, loadedResources };
}

async function verifySha256(bytes, expected) {
  if (!expected || !globalThis.crypto?.subtle) return;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const actual = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  if (actual !== expected) throw new Error("kernel/integrity: SHA-256 mismatch");
}

function filesystemDescriptor(value) {
  const [provider, ...parts] = String(value).split(":");
  return { provider: provider || "memory", key: parts.join(":") || "default" };
}

export async function createDocsKernel({
  wasmUrl,
  workerUrl,
  resources = {},
  manifest = null,
  fetchAsset = fetch,
  WorkerClass = Worker,
  ContextClass = HtaContext
}) {
  // Fetch every startup dependency before constructing the worker. This keeps
  // the kernel from becoming observable while its require resources are still
  // in flight on a cold page load.
  const { moduleBytes, loadedResources } =
    await loadKernelAssets(wasmUrl, resources, fetchAsset);
  await verifySha256(moduleBytes, manifest?.variants?.core?.sha256);
  const worker = new WorkerClass(workerUrl, { type: "module" });
  const canvasRuntimes = new Map();
  const context = new ContextClass({
    worker,
    moduleBytes,
    kernelId: `docs-${Math.random().toString(36).slice(2)}`,
    hostCalls: createHostServices({
      dbName: "hara-docs",
      canvasRuntimeForSession: (sessionId) => canvasRuntimes.get(sessionId)
    })
  });
  await context.ready;
  if (loadedResources.length > 0) {
    await context.call("register-resources", [loadedResources]);
  }
  const string = (value) => JSON.stringify(String(value));
  const facade = {
    context,
    async createSession(name, { filesystem = `memory:${name}` } = {}) {
      const session = await context.createSession(name);
      const mountId = await context.createFilesystem(filesystemDescriptor(filesystem));
      await session.attachFilesystem(mountId);
      const fsEval = async (form) =>
        session.eval(`(do (require [studio.fs :as fs]) ${form})`);
      return {
        id: name,
        filesystem,
        async eval(source) {
          const prepared = prepareDocsEval(source);
          return { value: await session.eval(prepared.source), label: prepared.label };
        },
        evalRaw: (source) => session.eval(source),
        evalVm: (source) => session.evalVm(source),
        prepareVm: (source) => session.prepareVm(source),
        invokeVm: (program) => session.invokeVm(program),
        traceEval: (source) => context.call("session/trace-eval", [name, source]),
        evalBound: (source, bindings = []) => session.evalBound(source, bindings),
        complete: (prefix) => session.complete(prefix),
        listFiles: (space = "guide") => fsEval(`(fs/list ${string(space)} "/")`),
        readFile: (path, space = "guide") =>
          fsEval(`(fs/read ${string(space)} ${string(path)})`),
        writeFile: (path, content, space = "guide") =>
          fsEval(`(fs/write! ${string(space)} ${string(path)} ${string(content)})`),
        deleteFile: (path, space = "guide") =>
          fsEval(`(fs/delete! ${string(space)} ${string(path)})`),
        registerCanvas(runtime) {
          canvasRuntimes.set(name, runtime);
          return () => canvasRuntimes.delete(name);
        },
        async close() {
          canvasRuntimes.delete(name);
          await session.detachFilesystem();
          await context.closeFilesystem(mountId);
          return session.close();
        }
      };
    },
    close() {
      context.close();
    }
  };
  facade.loadFeature = async (name) => {
    const specification = manifest?.variants?.[name];
    if (!specification || !["vm", "trace"].includes(name)) {
      throw new Error(`kernel/feature-unavailable: ${name}`);
    }
    const response = await fetchAsset(specification.url);
    if (!response.ok) throw new Error(`${specification.url}: ${response.status}`);
    const bytes = await response.arrayBuffer();
    await verifySha256(bytes, specification.sha256);
    const feature = await createDocsKernel({
      wasmUrl: specification.url,
      workerUrl,
      resources,
      fetchAsset: async (url) => url === specification.url ? new Response(bytes) : fetchAsset(url),
      WorkerClass,
      ContextClass
    });
    feature.kind = name;
    return feature;
  };
  return facade;
}
