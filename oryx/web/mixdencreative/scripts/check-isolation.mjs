import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const blocked = [
  /evntszn/i,
  /evntszn\.com/i,
  /\bNEXT_PUBLIC_APP_URL\b/,
  /\bNEXT_PUBLIC_SITE_URL\b/,
  /\bPUBLIC_HOST\b/,
  /\bPREVIEW_HOST\b/,
  /\bSUPABASE\b/,
  /\bSTRIPE\b/,
];

const ignoredDirs = new Set([".git", ".next", "node_modules"]);
const ignoredFiles = new Set(["README.md", "package-lock.json"]);
const allowedExtensions = new Set([
  ".css",
  ".json",
  ".jsonc",
  ".mjs",
  ".ts",
  ".tsx",
]);
const findings = [];
const approvedReferenceFiles = new Set(["app/page.tsx", "components/Footer.tsx"]);

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const relativePath = path.relative(root, fullPath);

    if (ignoredDirs.has(entry)) {
      continue;
    }

    if (ignoredFiles.has(entry)) {
      continue;
    }

    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (relativePath === "scripts") {
        continue;
      }
      walk(fullPath);
      continue;
    }

    if (!allowedExtensions.has(path.extname(entry))) {
      continue;
    }

    const content = readFileSync(fullPath, "utf8");

    for (const pattern of blocked) {
      if (pattern.test(content)) {
        if (
          pattern.source === "evntszn\\.com" ||
          pattern.source === "evntszn"
        ) {
          if (approvedReferenceFiles.has(relativePath)) {
            continue;
          }
        }
        findings.push(`${relativePath}: ${pattern}`);
      }
    }
  }
}

walk(root);

if (findings.length > 0) {
  console.error("Isolation check failed. Found blocked references:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log("Isolation check passed.");
