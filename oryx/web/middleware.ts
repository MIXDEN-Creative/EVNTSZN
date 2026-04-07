import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getAppOrigin,
  getBaseDomain,
  getCanonicalPath,
  getEplOrigin,
  getOpsOrigin,
  getScannerOrigin,
  getSurfaceFromHost,
  getWebOrigin,
} from "./src/lib/domains";
import { PUBLIC_CITIES } from "./src/lib/public-cities";

const STATIC_PREFIXES = ["/_next/static", "/_next/image"];
const STATIC_FILES = new Set([
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]);

const SECRET_PROBE_PATTERNS = [
  /^\/\.env(?:[./-].*)?$/i,
  /^\/.*\/\.env(?:[./-].*)?$/i,
  /^\/\.github(?:\/.*)?$/i,
  /^\/docker(?:\/.*)?$/i,
  /^\/production(?:\/.*)?$/i,
  /^\/config(?:\/.*)?$/i,
  /^\/kubernetes(?:\/.*)?$/i,
  /^\/secrets?(?:\/.*)?$/i,
  /^\/.*(?:secrets?|config|docker|kubernetes|production)\/.*\.env(?:[./-].*)?$/i,
];

export function middleware(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host ||
    "";
  const pathname = request.nextUrl.pathname;
  const surface = getSurfaceFromHost(host);
  const bareHost = host.replace(/:\d+$/, "").toLowerCase();
  const canonicalWebHost = new URL(getWebOrigin(host)).host.toLowerCase();
  const hostsWebHost = `hosts.${getBaseDomain()}`.toLowerCase();
  const url = request.nextUrl.clone();

  if (bareHost === hostsWebHost || bareHost === `www.${hostsWebHost}`) {
    if (pathname === "/") {
      url.pathname = "/hosts";
      return NextResponse.rewrite(url);
    }

    if (pathname === "/apply" || pathname.startsWith("/apply/")) {
      url.pathname = `/hosts${pathname}`;
      return NextResponse.rewrite(url);
    }

    if (pathname.startsWith("/api/public/applications")) {
      return NextResponse.next();
    }

    if (pathname === "/hosts" || pathname.startsWith("/hosts/")) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/", getWebOrigin(host)));
  }

  if (surface === "web" && bareHost === `www.${canonicalWebHost}`) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.host = canonicalWebHost;
    canonicalUrl.protocol = "https";
    return NextResponse.redirect(canonicalUrl, 308);
  }

  if (
    STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    pathname === "/access-restricted" ||
    pathname === "/ops" ||
    STATIC_FILES.has(pathname)
  ) {
    return NextResponse.next();
  }

  if (SECRET_PROBE_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return new NextResponse(null, { status: 404 });
  }

  const previewHost = process.env.PREVIEW_HOST || "preview.evntszn.com";
  const isPreviewHost =
    bareHost === previewHost || bareHost === `www.${previewHost}`;

  const internalAllowedPrefixes = [
    "/_next",
    "/api/stripe/webhook",
    "/api/webhooks/stripe",
    "/api/printful",
    "/api/orders/lookup",
  ];

  if (internalAllowedPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (isPreviewHost || !surface) {
    return NextResponse.next();
  }

  if (surface === "web") {
    const publicCityPaths = new Set(PUBLIC_CITIES.map((city) => `/${city.slug}`));
    const publicAllowed = [
    "/",
    "/events",
    "/hosts/apply",
    "/organizer/apply",
    "/signal/apply",
    "/ambassador/apply",
    "/partners/packages",
    "/orders/track",
    "/checkout/success",
    "/checkout/cancel",
    "/coming-soon",
    "/hosts",
    "/privacy",
    "/terms",
    "/refund-policy",
    "/liability-notice",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    ];
    const publicAllowedPrefixes = ["/events/"];
    const publicAllowedApiPatterns = [
      /^\/api\/evntszn\/events\/[^/]+\/checkout$/,
      /^\/api\/discovery\/search$/,
      /^\/api\/public\/applications$/,
      /^\/api\/programs\/applications$/,
      /^\/api\/sponsors\/checkout$/,
      /^\/api\/sponsors\/inquiries$/,
    ];

    if (pathname.startsWith("/account") || pathname.startsWith("/auth/callback")) {
      return NextResponse.redirect(new URL(getCanonicalPath(pathname, "app"), getAppOrigin(host)));
    }

    if (pathname.startsWith("/scanner")) {
      return NextResponse.redirect(new URL(getCanonicalPath(pathname, "scanner"), getScannerOrigin(host)));
    }

    if (pathname.startsWith("/epl")) {
      return NextResponse.redirect(new URL(getCanonicalPath(pathname, "epl"), getEplOrigin(host)));
    }

    if (pathname.startsWith("/organizer") || pathname.startsWith("/venue")) {
      return NextResponse.redirect(new URL(pathname, getOpsOrigin(host)));
    }

    const isPublicPath =
      publicAllowed.includes(pathname) ||
      publicCityPaths.has(pathname) ||
      publicAllowedPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
      publicAllowedApiPatterns.some((pattern) => pattern.test(pathname));

    if (!isPublicPath) {
      url.pathname = "/";
      return NextResponse.redirect(new URL(url.pathname, getWebOrigin(host)));
    }
    return NextResponse.next();
  }

  if (surface === "app") {
    if (pathname.startsWith("/scanner")) {
      return NextResponse.redirect(new URL(getCanonicalPath(pathname, "scanner"), getScannerOrigin(host)));
    }

    if (pathname.startsWith("/epl")) {
      return NextResponse.redirect(new URL(getCanonicalPath(pathname, "epl"), getEplOrigin(host)));
    }

    if (pathname.startsWith("/organizer") || pathname.startsWith("/venue")) {
      return NextResponse.redirect(new URL(pathname, getOpsOrigin(host)));
    }

    if (pathname === "/") {
      url.pathname = "/account";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (surface === "scanner") {
    if (pathname === "/") {
      url.pathname = "/account/login";
      return NextResponse.redirect(url);
    }

    if (
      pathname.startsWith("/account") ||
      pathname.startsWith("/auth/callback") ||
      pathname.startsWith("/api/evntszn") ||
      pathname.startsWith("/api/admin")
    ) {
      return NextResponse.next();
    }

    if (!pathname.startsWith("/scanner/")) {
      url.pathname = `/scanner${pathname}`;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  if (surface === "epl") {
    if (pathname === "/") {
      url.pathname = "/epl";
      return NextResponse.rewrite(url);
    }

    if (
      pathname.startsWith("/account") ||
      pathname.startsWith("/auth/callback") ||
      pathname.startsWith("/api/epl") ||
      pathname.startsWith("/api/admin") ||
      pathname.startsWith("/api/stripe") ||
      pathname.startsWith("/admin-invite")
    ) {
      return NextResponse.next();
    }

    if (!pathname.startsWith("/epl/")) {
      url.pathname = `/epl${pathname}`;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  if (surface === "ops") {
    if (pathname === "/") {
      url.pathname = "/ops";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  if (surface === "admin") {
    if (pathname === "/") {
      url.pathname = "/epl/admin";
      return NextResponse.rewrite(url);
    }

    if (
      pathname.startsWith("/account") ||
      pathname.startsWith("/auth/callback") ||
      pathname.startsWith("/api/admin") ||
      pathname.startsWith("/api/epl/admin") ||
      pathname.startsWith("/admin-invite")
    ) {
      return NextResponse.next();
    }

    if (pathname === "/store") {
      return NextResponse.redirect(new URL("/store", getEplOrigin(host)));
    }

    if (!pathname.startsWith("/epl/admin")) {
      url.pathname = `/epl/admin${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  if (surface === "hq") {
    if (pathname === "/") {
      url.pathname = "/epl/admin/operations";
      return NextResponse.rewrite(url);
    }

    if (
      pathname.startsWith("/account") ||
      pathname.startsWith("/auth/callback") ||
      pathname.startsWith("/api/admin") ||
      pathname.startsWith("/api/epl/admin") ||
      pathname.startsWith("/api/epl/draft") ||
      pathname.startsWith("/admin-invite")
    ) {
      return NextResponse.next();
    }

    if (!pathname.startsWith("/epl/admin")) {
      url.pathname = `/epl/admin${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
