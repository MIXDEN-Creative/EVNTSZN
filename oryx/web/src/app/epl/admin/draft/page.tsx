import DraftHostConsole from "./DraftHostConsole";

export default function EPLDraftAdminPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.28em] text-[#A259FF]">EPL Draft Control</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Commissioner Draft Console</h1>
          <p className="mt-3 text-white/65">
            Control pace, reveal picks, manage timing, and run the live draft presentation.
          </p>
        </div>

        <DraftHostConsole />
      </div>
    </main>
  );
}
