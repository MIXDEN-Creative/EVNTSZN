type SearchParams = {
  registration?: string;
};

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
          You are officially in the pipeline.
        </h1>
        <p className="mt-4 text-white/70">
          Your payment has been received and your registration is now under review for EPL Season 1.
        </p>
        {params.registration ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
            Registration Code: <span className="font-semibold text-white">{params.registration}</span>
          </div>
        ) : null}
      </div>
    </main>
  );
}
