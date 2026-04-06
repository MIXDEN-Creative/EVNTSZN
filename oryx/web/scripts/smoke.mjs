import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  assert(fs.existsSync(absolutePath), `Missing required file: ${relativePath}`);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function readText(relativePath) {
  const absolutePath = path.join(root, relativePath);
  assert(fs.existsSync(absolutePath), `Missing required file: ${relativePath}`);
  return fs.readFileSync(absolutePath, "utf8");
}

const appManifest = readJson(".next/server/app-paths-manifest.json");
const manifestRoutes = new Set(Object.keys(appManifest));

function hasBuiltRoute(route, type = "page") {
  return manifestRoutes.has(`${route}/${type}`);
}

[
  "/events",
  "/events/[slug]",
  "/organizer",
  "/venue",
  "/scanner/[eventSlug]",
  "/epl/season-1/register",
  "/epl/admin/operations",
  "/api/evntszn/events",
  "/api/evntszn/events/[eventId]/checkout",
  "/api/evntszn/events/[eventId]/scanner/check-in",
  "/api/epl/registrations",
  "/api/epl/draft/state",
].forEach((route) => {
  const type = route.startsWith("/api/") ? "route" : "page";
  assert(hasBuiltRoute(route, type), `Missing required built route: ${route}`);
});

const envExample = readText(".env.example");
[
  "NEXT_PUBLIC_DEV_ORIGIN",
  "NEXT_PUBLIC_BASE_DOMAIN",
  "NEXT_PUBLIC_PUBLIC_ORIGIN",
  "NEXT_PUBLIC_APP_ORIGIN",
  "NEXT_PUBLIC_SCANNER_ORIGIN",
  "NEXT_PUBLIC_EPL_ORIGIN",
  "NEXT_PUBLIC_OPS_ORIGIN",
  "NEXT_PUBLIC_HQ_ORIGIN",
  "NEXT_PUBLIC_ADMIN_ORIGIN",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "PRINTFUL_API_KEY",
  "RESEND_API_KEY",
  "MERCH_FROM_EMAIL",
  "PUBLIC_HOST",
  "PREVIEW_HOST",
].forEach((key) => {
  assert(envExample.includes(`${key}=`), `Missing env key in .env.example: ${key}`);
});

const domainsFile = readText("src/lib/domains.ts");
[
  "https://evntszn.com",
  "https://app.evntszn.com",
  "https://scanner.evntszn.com",
  "https://epl.evntszn.com",
  "https://ops.evntszn.com",
  "https://hq.evntszn.com",
  "https://admin.evntszn.com",
].forEach((origin) => {
  assert(domainsFile.includes(origin), `Missing canonical origin in domains utility: ${origin}`);
});

const middlewareFile = readText("middleware.ts");
assert(middlewareFile.includes("getSurfaceFromHost"), "Middleware is not surface-aware.");
assert(middlewareFile.includes('surface === "web"'), "Middleware does not expose public EVNTSZN web routing.");
assert(middlewareFile.includes('surface === "scanner"'), "Middleware does not expose scanner routing.");
assert(middlewareFile.includes('surface === "epl"'), "Middleware does not expose EPL routing.");
assert(middlewareFile.includes("SECRET_PROBE_PATTERNS"), "Middleware does not block secret-like probe paths.");

const migrationFiles = fs
  .readdirSync(path.join(root, "supabase/migrations"))
  .filter((file) => file.endsWith(".sql"));

assert(
  migrationFiles.some((file) => file.includes("evntszn_platform_core")),
  "Missing EVNTSZN platform core migration.",
);
assert(
  migrationFiles.some((file) => file.includes("epl_operating_schema")),
  "Missing EPL operating schema migration.",
);
assert(
  migrationFiles.some((file) => file.includes("patch_epl_player_operations")),
  "Missing EPL player operations patch migration.",
);

function readMigrationByName(fragment) {
  const file = migrationFiles.find((entry) => entry.includes(fragment));
  assert(file, `Missing migration matching: ${fragment}`);
  return readText(path.join("supabase/migrations", file));
}

const eplMigration = readMigrationByName("epl_operating_schema");
[
  "create schema if not exists epl",
  "create table if not exists epl.player_profiles",
  "create table if not exists epl.draft_sessions",
  "create or replace view public.epl_v_player_pipeline",
  "create or replace function public.epl_generate_random_draft_session",
].forEach((needle) => {
  assert(
    eplMigration.toLowerCase().includes(needle),
    `EPL migration is missing required contract: ${needle}`,
  );
});

const eplPlayerOpsMigration = readMigrationByName("patch_epl_player_operations");
[
  "create or replace view public.epl_v_admin_player_pool",
  "create or replace function public.epl_generate_random_draft_session",
  "create or replace function public.epl_manual_assign_pick_player",
].forEach((needle) => {
  assert(
    eplPlayerOpsMigration.toLowerCase().includes(needle),
    `EPL player operations migration is missing required contract: ${needle}`,
  );
});

console.log("Smoke checks passed.");
