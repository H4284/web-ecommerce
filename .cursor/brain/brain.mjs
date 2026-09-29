#!/usr/bin/env node
/**
 * brain.mjs — the one script of the brain. Node only (no bash, no python, no rsync). Works on macOS, Linux, Windows.
 *
 *   node scripts/brain.mjs new-site <client-slug> [parent-dir]   create a project from the brain (run in the brain repo)
 *   node .cursor/brain/brain.mjs sync [--no-pull] [--brain <dir>] pull the brain and re-sync managed files (run in a project)
 *   node scripts/brain.mjs check                                  lint the brain (run in the brain repo; CI runs this)
 *   node .cursor/brain/brain.mjs starter <layer>                  copy a verified starter into .tmp-starter/ (run in a project; landing|multipage|cms|ecommerce)
 *
 * Managed in a project (overwritten by sync): .cursor/rules/* except project-*.mdc · .cursor/skills/* · .cursor/mcp.json
 *   · .cursor/brain/{brain.mjs,references/,templates/} (references/**\/*.local.md kept) · brain.lock
 * Never touched: AGENTS.md, plan.md, DESIGN.md, LESSONS.md, brief/, code.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRAIN_REPO = process.env.BRAIN_REPO || "https://github.com/kentech01/cursor-brain.git";
const DEFAULT_BRAIN_DIR = process.env.BRAIN_DIR || path.join(os.homedir(), "thrio", "cursor-brain");
const [, , cmd, ...args] = process.argv;

const die = (msg, code = 1) => { console.error(msg); process.exit(code); };
const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, "utf8");
const git = (cwd, ...a) => execFileSync("git", a, { cwd, stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
const tryGit = (cwd, ...a) => { try { return git(cwd, ...a); } catch { return null; } };
const today = () => new Date().toISOString().slice(0, 10);
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", ".open-next", "out"]);

/** copy src dir into dst dir. keep: predicate(relPath) → true keeps an existing dst file that is not in src. */
function copyDir(src, dst, { keep = () => false, skip = () => false } = {}) {
  const seen = new Set();
  const walk = (s, d, rel) => {
    fs.mkdirSync(d, { recursive: true });
    for (const e of fs.readdirSync(s, { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (skip(r) || SKIP_DIRS.has(e.name)) continue;
      const sp = path.join(s, e.name), dp = path.join(d, e.name);
      if (e.isDirectory()) walk(sp, dp, r);
      else { fs.copyFileSync(sp, dp); seen.add(r); }
    }
  };
  walk(src, dst, "");
  // delete files in dst that are not in src (unless kept)
  const prune = (d, rel) => {
    if (!exists(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      const dp = path.join(d, e.name);
      if (e.isDirectory()) { prune(dp, r); if (fs.readdirSync(dp).length === 0 && !keep(r)) fs.rmdirSync(dp); }
      else if (!seen.has(r) && !keep(r)) fs.unlinkSync(dp);
    }
  };
  prune(dst, "");
}

function brainRoot() {
  // scripts/brain.mjs → brain root is the parent of scripts/; .cursor/brain/brain.mjs → not a brain root
  const root = path.resolve(HERE, "..");
  return exists(path.join(root, "references")) && exists(path.join(root, ".cursor", "rules")) ? root : null;
}

function findBrain(argv) {
  const i = argv.indexOf("--brain");
  const fromArg = i >= 0 ? path.resolve(argv[i + 1]) : null;
  const lock = exists("brain.lock") ? read("brain.lock") : "";
  const fromLock = (lock.match(/^path:\s*(.+)$/m) || [])[1];
  for (const c of [fromArg, fromLock && fromLock.trim(), DEFAULT_BRAIN_DIR]) {
    if (c && exists(path.join(c, ".cursor", "rules"))) return c;
  }
  return null;
}

// ---------------------------------------------------------------- sync
function sync(argv, { brainDir: forced, project = process.cwd(), quiet = false } = {}) {
  let brain = forced || findBrain(argv);
  if (!brain) {
    brain = DEFAULT_BRAIN_DIR;
    console.log(`cloning brain → ${brain}`);
    fs.mkdirSync(path.dirname(brain), { recursive: true });
    git(process.cwd(), "clone", "--quiet", BRAIN_REPO, brain);
  }
  if (!argv.includes("--no-pull") && exists(path.join(brain, ".git"))) {
    tryGit(brain, "pull", "--quiet", "--ff-only");
  }
  const cursor = path.join(project, ".cursor");
  fs.mkdirSync(cursor, { recursive: true });
  copyDir(path.join(brain, ".cursor", "rules"), path.join(cursor, "rules"), { keep: (r) => /^project-.*\.mdc$/.test(r) });
  copyDir(path.join(brain, ".cursor", "skills"), path.join(cursor, "skills"));
  fs.copyFileSync(path.join(brain, ".cursor", "mcp.json"), path.join(cursor, "mcp.json"));
  const pb = path.join(cursor, "brain");
  fs.mkdirSync(pb, { recursive: true });
  fs.copyFileSync(path.join(brain, "scripts", "brain.mjs"), path.join(pb, "brain.mjs"));
  copyDir(path.join(brain, "references"), path.join(pb, "references"), { keep: (r) => r.endsWith(".local.md"), skip: (r) => r.startsWith("screenshots") });
  copyDir(path.join(brain, "templates"), path.join(pb, "templates"));
  const oldLock = exists(path.join(project, "brain.lock")) ? read(path.join(project, "brain.lock")) : "";
  const oldCommit = (oldLock.match(/^commit:\s*(\w+)/m) || [])[1] || "none";
  const commit = tryGit(brain, "rev-parse", "--short", "HEAD") || "local";
  fs.writeFileSync(path.join(project, "brain.lock"),
    `# Managed by .cursor/brain/brain.mjs sync — do not edit by hand.\nrepo: ${BRAIN_REPO}\npath: ${brain}\ncommit: ${commit}\nsynced: ${today()}\n`);
  if (!quiet) console.log(`brain synced: ${oldCommit} → ${commit}`);
  if (!quiet && oldCommit !== "none" && oldCommit !== commit) {
    const log = tryGit(brain, "log", "--oneline", `${oldCommit}..${commit}`);
    if (log) console.log("changes:\n" + log.split("\n").map((l) => "  " + l).join("\n"));
  }
}

// ---------------------------------------------------------------- new-site
function newSite(argv) {
  const brain = brainRoot() || die("run new-site from the brain repo: node scripts/brain.mjs new-site <slug>");
  const slug = argv[0];
  if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) die("usage: node scripts/brain.mjs new-site <client-slug kebab-case> [parent-dir]", 2);
  const parent = argv[1] ? path.resolve(argv[1]) : path.join(os.homedir(), "thrio", "sites");
  const target = path.join(parent, slug);
  if (exists(target)) die(`refusing: ${target} already exists`);
  copyDir(path.join(brain, "templates"), target);
  for (const d of ["brief/brand", "brief/copy", "brief/photos", "brief/refs"]) {
    fs.mkdirSync(path.join(target, d), { recursive: true });
    fs.writeFileSync(path.join(target, d, ".gitkeep"), "");
  }
  const title = slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  for (const f of ["plan.md", "DESIGN.md", "AGENTS.md"]) {
    const p = path.join(target, f);
    if (!exists(p)) continue;
    fs.writeFileSync(p, read(p).replaceAll("[REQUIRED: CLIENT NAME]", title).replaceAll("[CLIENT NAME]", title).replaceAll("[REQUIRED: date]", today()));
  }
  sync([], { brainDir: brain, project: target, quiet: true });
  if (tryGit(target, "--version")) {
    tryGit(target, "init", "-q", "-b", "main");
    tryGit(target, "add", "-A");
    tryGit(target, "-c", "commit.gpgsign=false", "commit", "-q", "-m", `chore: new site from brain ${tryGit(brain, "rev-parse", "--short", "HEAD") || ""}`.trim());
  }
  console.log(`created ${target}\nnext:\n  1. create the GitHub repo and add it as origin, e.g.\n     gh repo create thrio/${slug} --private --source "${target}" --push\n     (no remote yet = fine for practice; skills then commit locally and skip PRs)\n  2. open "${target}" in Cursor\n  3. run /kickoff`);
}

// ---------------------------------------------------------------- starter
function starter(argv) {
  const layer = argv[0];
  if (!["landing", "multipage", "cms", "ecommerce"].includes(layer)) die("usage: node .cursor/brain/brain.mjs starter <landing|multipage|cms|ecommerce>", 2);
  const brain = findBrain(argv) || die(`brain not found — set BRAIN_DIR or run sync first`);
  const src = path.join(brain, "starters", layer);
  const meta = path.join(src, "STARTER.md");
  if (!exists(meta)) die(`no starter for '${layer}' — follow the recipe in .cursor/skills/scaffold/references/`, 3);
  if (!/^verified:\s*yes/m.test(read(meta))) die(`starter '${layer}' exists but is not verified (STARTER.md) — use the recipe`, 3);
  const out = path.join(process.cwd(), ".tmp-starter");
  fs.rmSync(out, { recursive: true, force: true });
  copyDir(src, out);
  console.log(`starter '${layer}' ready in .tmp-starter/`);
}

// ---------------------------------------------------------------- check
function check() {
  const brain = brainRoot() || die("run check from the brain repo: node scripts/brain.mjs check");
  const fails = [];
  const bad = (m) => fails.push(m);
  const listFiles = (dir) => { const out = []; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (SKIP_DIRS.has(e.name)) continue; const p = path.join(d, e.name); e.isDirectory() ? walk(p) : out.push(p); } }; if (exists(dir)) walk(dir); return out; };

  // rules
  let alwaysLines = 0;
  const rulesDir = path.join(brain, ".cursor", "rules");
  for (const f of fs.readdirSync(rulesDir).filter((f) => f.endsWith(".mdc"))) {
    const s = read(path.join(rulesDir, f));
    if (!s.startsWith("---\n")) bad(`${f}: no frontmatter`);
    if (!/^description:/m.test(s)) bad(`${f}: missing description`);
    if (!/^alwaysApply:/m.test(s)) bad(`${f}: missing alwaysApply`);
    const n = s.split("\n").length;
    if (n > 120) bad(`${f}: ${n} lines (max 120 — split it)`);
    if (/^alwaysApply: true/m.test(s)) alwaysLines += n;
  }
  console.log(`always-on lines: ${alwaysLines} (budget 250)`);
  if (alwaysLines > 250) bad("always-on rules exceed 250 lines");

  // skills
  const skillsDir = path.join(brain, ".cursor", "skills");
  for (const d of fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    const p = path.join(skillsDir, d.name, "SKILL.md");
    if (!exists(p)) { bad(`${d.name}: no SKILL.md`); continue; }
    const s = read(p);
    if (!new RegExp(`^name: ${d.name}$`, "m").test(s)) bad(`${d.name}/SKILL.md: name must be '${d.name}'`);
    if (!/^description:/m.test(s)) bad(`${d.name}/SKILL.md: missing description`);
  }

  // referenced repo paths in backticks must exist (project-side paths are skipped)
  const projectSide = /^(\.cursor\/brain\/(references|templates|brain\.mjs)|\.cursor\/rules\/project-|docs\/(editor-guide|handoff|admin-guide|payment-runbook)\.md|scripts\/[\w/-]+\.ts$|\.cursor\/commands|\.cursor\/hooks\.json|\.tmp-starter|starters\/(landing|multipage|cms|ecommerce|dashboard))/;
  const texts = [...listFiles(path.join(brain, ".cursor")), ...listFiles(path.join(brain, "docs")), path.join(brain, "README.md"), path.join(brain, "references", "README.md")]
    .filter((p) => /\.(md|mdc)$/.test(p) && !p.includes(`${path.sep}notes${path.sep}`)); // docs/notes are historical
  const missing = new Set();
  for (const p of texts) {
    for (const m of read(p).matchAll(/`((?:\.cursor|scripts|references|templates|docs|starters)\/[A-Za-z0-9_./-]+)`/g)) {
      const ref = m[1];
      if (/[<>*{…]/.test(ref) || projectSide.test(ref)) continue;
      const adr = ref.match(/^docs\/adr\/(\d{4})$/);
      if (adr) { if (!fs.readdirSync(path.join(brain, "docs", "adr")).some((f) => f.startsWith(adr[1]))) missing.add(ref); continue; }
      if (!exists(path.join(brain, ref))) missing.add(ref);
    }
  }
  for (const m of missing) bad(`referenced path missing: ${m}`);

  // forbidden strings
  const forbidden = /alixpartners|promoxray|AP\.PXR|endjin|\/Users\/home2|home2\/Desktop/i;
  for (const p of [...texts, ...listFiles(path.join(brain, "templates"))].filter((p) => /\.(md|mdc|json|yml|yaml)$/.test(p))) {
    if (forbidden.test(read(p))) bad(`forbidden string in ${path.relative(brain, p)}`);
  }

  // json + self syntax
  try { JSON.parse(read(path.join(brain, ".cursor", "mcp.json"))); } catch (e) { bad(`.cursor/mcp.json: ${e.message}`); }
  try { execFileSync(process.execPath, ["--check", fileURLToPath(import.meta.url)]); } catch { bad("scripts/brain.mjs: syntax error"); }

  if (fails.length) { for (const f of fails) console.log("FAIL: " + f); die("brain check failed"); }
  console.log("OK — brain is clean");
}

switch (cmd) {
  case "new-site": newSite(args); break;
  case "sync": sync(args); break;
  case "check": check(); break;
  case "starter": starter(args); break;
  default: die("usage: node brain.mjs <new-site|sync|check|starter> …  (see header of this file)", 2);
}
