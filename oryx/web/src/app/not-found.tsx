import Link from "next/link";
import { headers } from "next/headers";
import { getAppOrigin, getEplOrigin } from "@/lib/domains";

export default async function NotFoundPage() {
  const host = (await headers()).get("host") || undefined;
  const isEplHost = host?.includes("epl.");
  return (
    <main className="min-h-screen bg-black text-white grid place-items-center p-6">
      <div className="text-center max-w-xl">
        <div className="inline-flex items-center rounded-full border border-[#A259FF]/40 bg-[#A259FF]/10 px-4 py-1 text-sm text-[#d8c2ff]">
          EVNTSZN
        </div>
        <h1 className="mt-5 text-5xl font-black">Page not found</h1>
        <p className="mt-3 text-white/65">
          That route doesn’t exist yet. Let’s get you somewhere useful.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {isEplHost ? (
            <>
              <Link href={`${getEplOrigin(host)}`} className="rounded-2xl bg-[#A259FF] px-5 py-3 font-bold">
                Back to EPL
              </Link>
              <Link href={`${getEplOrigin(host)}/season-1/register`} className="rounded-2xl border border-white/15 px-5 py-3 hover:bg-white/10">
                Register
              </Link>
              <Link href={`${getEplOrigin(host)}/teams`} className="rounded-2xl border border-white/15 px-5 py-3 hover:bg-white/10">
                View Teams
              </Link>
              <Link href={`${getEplOrigin(host)}/standings`} className="rounded-2xl border border-white/15 px-5 py-3 hover:bg-white/10">
                View Standings
              </Link>
            </>
          ) : (
            <>
              <Link href={`${getAppOrigin(host)}/`} className="rounded-2xl bg-[#A259FF] px-5 py-3 font-bold">
                Homepage
              </Link>
              <Link href={`${getEplOrigin(host)}/`} className="rounded-2xl border border-white/15 px-5 py-3 hover:bg-white/10">
                Explore EPL
              </Link>
            </>
          )}
          <Link
            href={`${getAppOrigin(host)}/account/login`}
            className="rounded-2xl border border-white/15 px-5 py-3 hover:bg-white/10"
          >
            Account Login
          </Link>
        </div>
      </div>
    </main>
  );
}
