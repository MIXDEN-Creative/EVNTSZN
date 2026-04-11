type SearchParams = {
  registration?: string;
};

const WAIVER_URL = "https://tally.so/r/XxY8xz";

export default async function EPLRegistrationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-2xl rounded-[36px] border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-[#A259FF]">Registration Received</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Your player file is in.
        </h1>
        <p className="mt-4 text-white/70">
          Your payment has been received and your registration is now under review for EPL Season 1. Finish the waiver next so your file is ready for the full player pipeline.
        </p>
        {params.registration ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
            Registration Code: <span className="font-semibold text-white">{params.registration}</span>
          </div>
        ) : null}
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5 text-left text-sm text-white/75">
          <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">Next step</div>
          <div className="mt-2 text-base font-semibold text-white">Complete your league waiver</div>
          <p className="mt-2 text-white/65">
            Keep your registration moving by finishing the waiver right away. League operations can review your file faster when payment, waiver, and player details are all in place.
          </p>
          <a
            href={WAIVER_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-2xl bg-[#A259FF] px-5 py-3 font-semibold text-white"
          >
            Open waiver
          </a>
        </div>
      </div>
    </main>
  );
}
