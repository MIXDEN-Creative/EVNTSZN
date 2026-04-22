import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getAppOrigin,
  getBaseDomain,
  getCanonicalPath,
  getEplOrigin,
  getOpsOrigin,
  getReserveOrigin,
  getScannerOrigin,
  getStayOpsOrigin,
  getSurfaceFromHost,
  getWebOrigin,
  hasConfiguredOrigin,
  isLocalHost,
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
  const redirectToOrigin = (targetPath: string, targetOrigin: string) => {
    const targetUrl = new URL(targetPath, targetOrigin);
    const targetHost = targetUrl.host.replace(/:\d+$/, "").toLowerCase();

    if (
      targetHost === bareHost &&
      targetUrl.pathname === pathname &&
      targetUrl.search === request.nextUrl.search
    ) {
      return NextResponse.next();
    }

    return NextResponse.redirect(targetUrl);
  };

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
    const reservedSingleSegment = new Set([
      "account",
      "admin-login",
      "admin-invite",
      "auth",
      "api",
      "scanner",
      "epl",
      "organizer",
      "venue",
      "ops",
      "hosts",
      "events",
      "pulse",
      "crew",
      "link",
      "reserve",
      "nodes",
      "support",
      "privacy",
      "terms",
      "refund-policy",
      "liability-notice",
      "stayops",
      "orders",
      "checkout",
      "coming-soon",
      "partners",
      "sponsors",
      "signal",
      "ambassador",
      "store",
    ]);
    const isSingleSegmentPublicSlug = /^\/[^/]+$/.test(pathname)
      && !reservedSingleSegment.has(pathname.slice(1).toLowerCase());
    const publicAllowed = [
    "/",
    "/events",
    "/pulse",
    "/crew",
    "/link",
    "/reserve",
    "/nodes",
    "/partners",
    "/sponsors",
    "/hosts/apply",
    "/organizer/apply",
    "/signal/apply",
    "/ambassador/apply",
    "/orders/track",
    "/checkout/success",
    "/checkout/cancel",
    "/coming-soon",
    "/hosts",
    "/stayops",
    "/support",
    "/privacy",
    "/terms",
    "/refund-policy",
    "/liability-notice",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    ];
    const publicAllowedPrefixes = ["/events/", "/crew/", "/link/", "/nodes/", "/stayops/"];
    const publicAllowedApiPatterns = [
      /^\/api\/evntszn\/events\/[^/]+\/checkout$/,
      /^\/api\/evntszn\/events\/[^/]+\/pulse$/,
      /^\/api\/evntszn\/link\/[^/]+\/click$/,
      /^\/api\/evntszn\/link\/[^/]+\/view$/,
      /^\/api\/evntszn\/link\/leads$/,
      /^\/api\/evntszn\/crew$/,
      /^\/api\/evntszn\/crew\/requests(?:\/[^/]+)?$/,
      /^\/api\/evntszn\/nodes\/[^/]+\/interactions$/,
      /^\/api\/evntszn\/nodes\/[^/]+\/pulse$/,
      /^\/api\/discovery\/search$/,
      /^\/api\/public\/applications$/,
      /^\/api\/programs\/applications$/,
      /^\/api\/support\/tickets$/,
      /^\/api\/stayops\/intake$/,
      /^\/api\/sponsors\/checkout$/,
      /^\/api\/sponsors\/inquiries$/,
    ];

    if (pathname.startsWith("/account") || pathname.startsWith("/auth/callback")) {
      return redirectToOrigin(getCanonicalPath(pathname, "app"), getAppOrigin(host));
    }

    if (pathname.startsWith("/scanner")) {
      return redirectToOrigin(getCanonicalPath(pathname, "scanner"), getScannerOrigin(host));
    }

    if (pathname.startsWith("/reserve")) {
      if (isLocalHost(host) || !hasConfiguredOrigin("reserve")) {
        return NextResponse.next();
      }
      return redirectToOrigin(pathname, getReserveOrigin(host));
    }

    if (pathname.startsWith("/epl")) {
      return redirectToOrigin(getCanonicalPath(pathname, "epl"), getEplOrigin(host));
    }

    if (pathname.startsWith("/organizer") || pathname.startsWith("/venue")) {
      return redirectToOrigin(pathname, getOpsOrigin(host));
    }

    const isPublicPath =
      publicAllowed.includes(pathname) ||
      publicCityPaths.has(pathname) ||
      isSingleSegmentPublicSlug ||
      publicAllowedPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
      publicAllowedApiPatterns.some((pattern) => pattern.test(pathname));

    if (!isPublicPath) {
      url.pathname = "/";
      return NextResponse.redirect(new URL(url.pathname, getWebOrigin(host)));
    }
    return NextResponse.next();
  }

  if (surface === "app") {
    if (pathname.startsWith("/stayops")) {
      return redirectToOrigin(getCanonicalPath(pathname, "stayops"), getStayOpsOrigin(host));
    }

    if (pathname.startsWith("/reserve")) {
      if (isLocalHost(host) || !hasConfiguredOrigin("reserve")) {
        return NextResponse.next();
      }
      return redirectToOrigin(pathname, getReserveOrigin(host));
    }

    if (pathname.startsWith("/scanner")) {
      return redirectToOrigin(getCanonicalPath(pathname, "scanner"), getScannerOrigin(host));
    }

    if (pathname.startsWith("/epl")) {
      return redirectToOrigin(getCanonicalPath(pathname, "epl"), getEplOrigin(host));
    }

    if (pathname.startsWith("/organizer") || pathname.startsWith("/venue")) {
      return redirectToOrigin(pathname, getOpsOrigin(host));
    }

    if (pathname === "/") {
      url.pathname = "/account";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (surface === "stayops") {
    if (pathname === "/") {
      url.pathname = "/stayops";
      return NextResponse.rewrite(url);
    }

    if (pathname === "/intake" || pathname.startsWith("/intake/")) {
      url.pathname = `/stayops${pathname}`;
      return NextResponse.rewrite(url);
    }

    if (pathname === "/confirmation" || pathname.startsWith("/confirmation/")) {
      url.pathname = `/stayops${pathname}`;
      return NextResponse.rewrite(url);
    }

    if (pathname.startsWith("/api/stayops/")) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/account")) {
      return redirectToOrigin(getCanonicalPath(pathname, "app"), getAppOrigin(host));
    }

    if (pathname.startsWith("/scanner")) {
      return redirectToOrigin(getCanonicalPath(pathname, "scanner"), getScannerOrigin(host));
    }

    if (pathname.startsWith("/reserve")) {
      if (isLocalHost(host) || !hasConfiguredOrigin("reserve")) {
        return NextResponse.next();
      }
      return redirectToOrigin(pathname, getReserveOrigin(host));
    }

    if (pathname.startsWith("/epl")) {
      return redirectToOrigin(getCanonicalPath(pathname, "epl"), getEplOrigin(host));
    }

    if (pathname.startsWith("/organizer") || pathname.startsWith("/venue")) {
      return redirectToOrigin(pathname, getOpsOrigin(host));
    }

    if (pathname.startsWith("/stayops")) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL(pathname, getWebOrigin(host)));
  }

  if (surface === "reserve") {
    if (pathname === "/") {
      url.pathname = "/reserve";
      return NextResponse.rewrite(url);
    }

    if (
      pathname.startsWith("/account") ||
      pathname.startsWith("/auth/callback") ||
      pathname.startsWith("/api/reserve") ||
      pathname.startsWith("/api/admin") ||
      pathname.startsWith("/admin-login")
    ) {
      return NextResponse.next();
    }

    if (!pathname.startsWith("/reserve")) {
      url.pathname = `/reserve${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  if (surface === "scanner") {
    if (pathname === "/") {
      url.pathname = "/admin-login";
      url.search = `?next=${encodeURIComponent("/scanner")}`;
      return NextResponse.redirect(url);
    }

    if (
      pathname.startsWith("/admin-login") ||
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
      pathname.startsWith("/admin-login") ||
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
      pathname.startsWith("/admin-login") ||
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
      pathname.startsWith("/admin-login") ||
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
