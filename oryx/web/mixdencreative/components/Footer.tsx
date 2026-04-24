import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-4">
          <Image
            src="/images/mixden-creative-logo.png"
            alt="MIXDEN Creative"
            width={136}
            height={48}
            className="h-10 w-auto"
          />
          <div className="space-y-1 text-sm text-white/62">
            <p>MIXDEN Creative</p>
            <p>mixdencreative.com</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-white/62 md:max-w-md md:text-right">
          <a
            href="#booking"
            className="inline-flex text-white transition hover:text-[var(--color-accent)]"
          >
            Book Your Creative Strategy Call
          </a>
          <p>
            MIXDEN Creative is part of the MIXDEN ecosystem. Explore events,
            experiences, and social discovery on{" "}
            <a
              href="https://evntszn.com"
              target="_blank"
              rel="noreferrer"
              className="text-white transition hover:text-[var(--color-accent)]"
            >
              EVNTSZN
            </a>
            .
          </p>
          <p>© 2026 MIXDEN Creative. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
