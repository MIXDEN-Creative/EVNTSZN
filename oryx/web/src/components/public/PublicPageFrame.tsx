import type { ReactNode } from "react";
import Image from "next/image";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";

export default function PublicPageFrame({
  children,
  title,
  description,
  heroImage,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  heroImage?: string | null;
  seo?: {
    title?: string;
    description?: string;
  };
}) {
  return (
    <main className="min-h-screen bg-black text-white">
      <PublicNav />
      {title || description || heroImage ? (
        <section className="relative overflow-hidden border-b border-white/10">
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
          <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-20">
            {title ? <div className="ev-title max-w-4xl">{title}</div> : null}
            {description ? <p className="ev-subtitle mt-4 max-w-3xl">{description}</p> : null}
          </div>
        </section>
      ) : null}
      {children}
      <PublicFooter />
    </main>
  );
}
