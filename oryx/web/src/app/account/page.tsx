import Link from "next/link";

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#120f2a] via-[#0c0c15] to-black p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">
            Member account
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-6xl">
            Your EVNTSZN account is the control point for tickets, orders, and what you want next.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/74">
            This is the member layer. Discovery stays public, but your tickets, saved activity, and member actions live here where they should.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Explore events",
                body: "Jump back into the public discovery layer and find what is worth moving on.",
                href: "https://evntszn.com",
                label: "Open discovery",
              },
              {
                title: "EPL",
                body: "Move into the league surface for registration, schedule rhythm, and draft-night energy.",
                href: "https://epl.evntszn.com",
                label: "Open EPL",
              },
              {
                title: "Track orders",
                body: "Follow purchases, confirmations, and related account activity.",
                href: "/orders/track",
                label: "Track orders",
              },
              {
                title: "Log out",
                body: "Sign out cleanly when you are done.",
                href: "/account/logout",
                label: "Log out",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="text-xl font-bold tracking-tight text-white">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-white/72">{item.body}</p>
                <Link
                  href={item.href}
                  className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
