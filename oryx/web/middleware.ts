import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getAppOrigin,
  getCanonicalPath,
  getEplOrigin,
  getOpsOrigin,
  getScannerOrigin,
  getSurfaceFromHost,
  getWebOrigin,
} from "./src/lib/domains";

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
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;
  const surface = getSurfaceFromHost(host);

  if (
    STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    STATIC_FILES.has(pathname)
  ) {
    return NextResponse.next();
  }

  if (SECRET_PROBE_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return new NextResponse(null, { status: 404 });
  }

  const previewHost = process.env.PREVIEW_HOST || "preview.evntszn.com";

  const bareHost = host.replace(/:\d+$/, "");
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

  const url = request.nextUrl.clone();

  if (surface === "web") {
    const publicAllowed = [
    "/",
    "/events",
    "/orders/track",
    "/checkout/success",
    "/checkout/cancel",
    "/coming-soon",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    ];
    const publicAllowedPrefixes = ["/events/"];
    const publicAllowedApiPatterns = [/^\/api\/evntszn\/events\/[^/]+\/checkout$/];

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
      url.pathname = "/epl/season-1/register";
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
      url.pathname = "/organizer";
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
