import type { ReactNode } from "react";
import Image from "next/image";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import StructuredData from "@/components/seo/StructuredData";
import { buildBreadcrumbSchema, type BreadcrumbItem } from "@/lib/seo";

export default function PublicPageFrame({
  children,
  title,
  description,
  heroImage,
  breadcrumbs,
  structuredData,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  heroImage?: string | null;
  breadcrumbs?: BreadcrumbItem[];
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>> | null;
  seo?: {
    title?: string;
    description?: string;
  };
}) {
  return (
    <div className="ev-public-page bg-black text-white">
      {breadcrumbs?.length ? <StructuredData id="breadcrumbs-structured-data" data={buildBreadcrumbSchema(breadcrumbs)} /> : null}
      {structuredData ? <StructuredData id="page-structured-data" data={structuredData} /> : null}
      <PublicNav />
      {title || description || heroImage ? (
        <section className="ev-public-section">
          <div className="ev-public-hero relative">
            {heroImage ? (
              <div className="absolute inset-0">
                <Image
                  src={heroImage}
                  alt={title || "EVNTSZN"}
                  fill
                  unoptimized
                  sizes="100vw"
                  className="object-cover opacity-35"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/55 to-black" />
              </div>
            ) : null}
            <div className="ev-public-hero__content">
              {breadcrumbs?.length ? (
                <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-white/48">
                  {breadcrumbs.map((crumb, index) => (
                    <span key={`${crumb.path}-${crumb.name}`} className="flex items-center gap-2">
                      {index ? <span className="text-white/24">/</span> : null}
                      <a href={crumb.path} className="hover:text-white/72">
                        {crumb.name}
                      </a>
                    </span>
                  ))}
                </nav>
              ) : null}
              {title ? <div className="ev-title max-w-4xl">{title}</div> : null}
              {description ? <p className="ev-subtitle mt-4 max-w-3xl">{description}</p> : null}
            </div>
          </div>
        </section>
      ) : null}
      <div>{children}</div>
      <PublicFooter />
    </div>
  );
}
