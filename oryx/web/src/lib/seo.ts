import type { Metadata } from "next";
import { getWebOrigin } from "@/lib/domains";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

function absoluteUrl(path: string) {
  const origin = getWebOrigin();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  keywords?: string[];
  origin?: string;
}): Metadata {
  const origin = input.origin || getWebOrigin();
  const image = input.image || `${origin}/brand/eplhero.png`;
  const canonical =
    input.path.startsWith("http://") || input.path.startsWith("https://")
      ? input.path
      : `${origin}${input.path.startsWith("/") ? input.path : `/${input.path}`}`;

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: "EVNTSZN",
      type: "website",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildCollectionPageSchema(input: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    isPartOf: {
      "@type": "WebSite",
      name: "EVNTSZN",
      url: getWebOrigin(),
    },
  };
}

export function buildOrganizationSchema() {
  const origin = getWebOrigin();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: "EVNTSZN",
        url: origin,
        logo: `${origin}/brand/evntszn-icon.png`,
        sameAs: [origin],
        description:
          "EVNTSZN is the nightlife, events, city experiences, and reservations platform for people searching what to do next.",
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: origin,
        name: "EVNTSZN",
        publisher: {
          "@id": `${origin}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${origin}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function buildItemListSchema(input: {
  name: string;
  path: string;
  items: Array<{
    name: string;
    url: string;
    image?: string | null;
    startDate?: string | null;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    url: absoluteUrl(input.path),
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(item.url),
      item: {
        "@type": item.startDate ? "Event" : "Thing",
        name: item.name,
        ...(item.image ? { image: absoluteUrl(item.image) } : {}),
        ...(item.startDate ? { startDate: item.startDate } : {}),
      },
    })),
  };
}

export function toAbsoluteImageUrl(image: string | null | undefined) {
  if (!image) return null;
  return absoluteUrl(image);
}
