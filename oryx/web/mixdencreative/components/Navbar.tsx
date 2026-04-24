import Image from "next/image";

const links = [
  { href: "#packages", label: "Packages" },
  { href: "#deposit", label: "Deposit" },
  { href: "#booking", label: "Booking" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3">
          <Image
            src="/images/mixden-creative-logo.png"
            alt="MIXDEN Creative"
            width={136}
            height={48}
            className="h-10 w-auto"
            priority
          />
        </a>

        <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#booking"
          className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-white"
        >
          Book Call
        </a>
      </div>
    </header>
  );
}
