import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildContentSecurityPolicy,
  FORBIDDEN_CARD_IDENTIFIERS,
  SECRET_ENV_NAMES,
  securityHeaderList,
} from "@/lib/shop/security-headers";
import { loginFormSchema } from "@/lib/shop/auth-schema";

const ROOT = process.cwd();

const SOURCE_DIRS = ["app", "components", "lib", "content", "scripts"] as const;
const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function walkFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkFiles(full, out);
    else if (SOURCE_EXT.has(name.slice(name.lastIndexOf(".")))) out.push(full);
  }
  return out;
}

function readSourceFiles(): Array<{ path: string; text: string }> {
  const files: Array<{ path: string; text: string }> = [];
  for (const dir of SOURCE_DIRS) {
    for (const full of walkFiles(join(ROOT, dir))) {
      files.push({ path: relative(ROOT, full).replace(/\\/g, "/"), text: readFileSync(full, "utf8") });
    }
  }
  return files;
}

describe("security headers", () => {
  it("emits HSTS, nosniff, referrer, permissions, frame deny, CSP", () => {
    const keys = securityHeaderList().map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "Strict-Transport-Security",
        "X-Content-Type-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "X-Frame-Options",
        "Content-Security-Policy",
      ]),
    );
    const csp = buildContentSecurityPolicy();
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("https://challenges.cloudflare.com");
  });

  it("adds BANK_ENDPOINT to connect-src when set", () => {
    const prev = process.env.BANK_ENDPOINT;
    process.env.BANK_ENDPOINT = "https://pay.example-bank.test/v1";
    try {
      expect(buildContentSecurityPolicy()).toContain(
        "https://pay.example-bank.test/v1",
      );
    } finally {
      if (prev === undefined) delete process.env.BANK_ENDPOINT;
      else process.env.BANK_ENDPOINT = prev;
    }
  });
});

describe("login abuse fields", () => {
  it("requires turnstile and rejects a filled honeypot", () => {
    expect(
      loginFormSchema.safeParse({
        email: "admin@example.com",
        password: "x",
        turnstileToken: "tok",
        website: "",
      }).success,
    ).toBe(true);
    expect(
      loginFormSchema.safeParse({
        email: "admin@example.com",
        password: "x",
        turnstileToken: "",
        website: "",
      }).success,
    ).toBe(false);
    expect(
      loginFormSchema.safeParse({
        email: "admin@example.com",
        password: "x",
        turnstileToken: "tok",
        website: "http://spam.test",
      }).success,
    ).toBe(false);
  });
});

describe("secret and card audit", () => {
  it("never puts a secret name behind NEXT_PUBLIC_", () => {
    const files = readSourceFiles();
    const hits: string[] = [];
    for (const name of SECRET_ENV_NAMES) {
      const re = new RegExp(`NEXT_PUBLIC_${name}|NEXT_PUBLIC_.*${name}`);
      for (const f of files) {
        if (f.path.includes("security-headers.ts")) continue;
        if (re.test(f.text)) hits.push(`${f.path}:${name}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("has no card-adjacent identifiers in app source", () => {
    const files = readSourceFiles();
    const hits: string[] = [];
    for (const id of FORBIDDEN_CARD_IDENTIFIERS) {
      const re = new RegExp(`\\b${id}\\b`);
      for (const f of files) {
        if (f.path.includes("security-headers.ts")) continue;
        if (re.test(f.text)) hits.push(`${f.path}:${id}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("renders markdown without raw HTML", () => {
    const files = readSourceFiles().filter((f) =>
      /react-markdown|ReactMarkdown/.test(f.text),
    );
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      expect(f.text, f.path).toMatch(/skipHtml/);
    }
  });

  it("client bundle has no secret env names when .next exists", () => {
    const staticDir = join(ROOT, ".next", "static");
    if (!existsSync(staticDir)) return;

    const chunks: string[] = [];
    walkFiles(staticDir, chunks);
    const jsChunks = chunks.filter((p) => p.endsWith(".js"));
    expect(jsChunks.length).toBeGreaterThan(0);

    const hits: string[] = [];
    for (const full of jsChunks) {
      const text = readFileSync(full, "utf8");
      for (const name of SECRET_ENV_NAMES) {
        if (text.includes(name)) {
          hits.push(`${relative(ROOT, full).replace(/\\/g, "/")}:${name}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });
});
