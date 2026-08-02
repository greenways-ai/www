export type Project = {
  slug: "hara" | "hoplite" | "hestia" | "historian";
  name: string;
  epithet: string;
  summary: string;
  status: string;
  license: string;
  repository: string;
  homepage?: string;
  docs?: string;
  motif: string;
  accent: string;
  architecture: string[];
  capabilities: string[];
  command: string;
  note: string;
};

export const projects: Project[] = [
  {
    slug: "hara",
    name: "Hara",
    epithet: "The living language",
    summary: "A programmable, runtime-neutral kernel for building, inspecting and changing live systems through HAL.",
    status: "Experimental runtime",
    license: "EPL-2.0",
    repository: "https://github.com/hara-lang/hara",
    homepage: "https://hara-lang.org",
    docs: "https://docs.hara-lang.org",
    motif: "The infinite ribbon",
    accent: "cyan",
    architecture: ["HAL source", "Hara kernel", "Truffle · Rust · WASM", "Capability-bound hosts"],
    capabilities: ["EDN-compatible HAL", "Native and browser runtimes", "Promises and fibers", "Explicit capabilities"],
    command: "brew install hara-lang/tap/hara\nhara eval '(+ 19 23)'",
    note: "Hara is the shared computational foundation beneath Greenways tools. Its L0 core and conformance corpora are the current source of truth."
  },
  {
    slug: "hoplite",
    name: "Hoplite",
    epithet: "The guarded gateway",
    summary: "A Hara application server embedded in Nginx, with immutable resource trees and worker-local compiled handlers.",
    status: "Pre-release · macOS-first",
    license: "EPL-2.0",
    repository: "https://github.com/greenways-ai/hoplite",
    motif: "Shield and threshold",
    accent: "bronze",
    architecture: ["HTTP request", "Nginx", "HTA value", "Cached Hara handler", "HTA response"],
    capabilities: ["Embedded Nginx host", "Asynchronous Hara handlers", "Generated OpenAPI", "Standalone executable"],
    command: "git clone https://github.com/greenways-ai/hoplite.git\ncd hoplite && make setup && make check",
    note: "The packaged executable currently targets macOS. Linux is exercised by CI and Docker while the first tagged release is prepared."
  },
  {
    slug: "hestia",
    name: "Hestia",
    epithet: "The sovereign hearth",
    summary: "A personal, local-first security and open-communications server for identity, recovery, provenance and rights.",
    status: "Experimental local node",
    license: "EPL-2.0",
    repository: "https://github.com/greenways-ai/hestia",
    motif: "Hearth and sanctuary",
    accent: "ember",
    architecture: ["User-owned keys", "Independent recovery", "Hoplite origin", "PostgreSQL ledger"],
    capabilities: ["Local-first operation", "Append-only events", "Blind WebRTC relay", "Independent recovery authorities"],
    command: "scripts/hestia init\nscripts/hestia doctor\nscripts/hestia up",
    note: "Greenways defines protocols and accredits independent authorities. A Hestia node remains independently run; Greenways cannot recover a key alone."
  },
  {
    slug: "historian",
    name: "Historian",
    epithet: "The memory of change",
    summary: "Git-native temporal code indexing, lineage, history and structural similarity with deterministic local retrieval.",
    status: "Active development",
    license: "Apache-2.0",
    repository: "https://github.com/greenways-ai/historian",
    motif: "Archive and strata",
    accent: "lapis",
    architecture: ["Git commit DAG", "Language analyzers", "Content addresses", "SQLite history"],
    capabilities: ["Incremental indexing", "Symbol lineage", "Structural similarity", "No LLM required"],
    command: "npm install -g @greenways-ai/historian\ngw-historian doctor\ngw-historian init",
    note: "Git remains the source of truth. Historian analyzes changed blobs once and keeps one local SQLite history database per repository."
  }
];

export const projectBySlug = Object.fromEntries(projects.map((project) => [project.slug, project])) as Record<Project["slug"], Project>;
