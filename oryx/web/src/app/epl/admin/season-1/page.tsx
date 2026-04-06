import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

type PlayerMasterRow = {
  player_key: string;
  player_profile_id: string | null;
  player_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_position: string | null;
  secondary_position: string | null;
  jersey_name: string | null;
  preferred_jersey_number_1: number | null;
  preferred_jersey_number_2: number | null;
  total_applications: number;
  approved_applications: number;
  waitlisted_applications: number;
  declined_applications: number;
  paid_seasons: number;
  seasons: string | null;
  season_slugs: string[] | null;
  last_submitted_at: string | null;
  last_paid_at: string | null;
};

function StatBadge({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

export default async function EPLSeasonOneAdminPage() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("epl_v_admin_players_master")
    .select("*")
    .order("last_submitted_at", { ascending: false });

  if (error) {
    console.error("EPL master admin query failed:", error);

    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-red-500/30 bg-red-500/10 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-red-200/80">
            EPL Admin Error
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-white">
            The master player database could not load.
          </h1>
          <p className="mt-3 text-sm text-red-100/80">{error.message}</p>
        </div>
      </main>
    );
  }

  const rows = (data || []) as PlayerMasterRow[];

  const totalPlayers = rows.length;
  const totalApplications = rows.reduce((sum, row) => sum + Number(row.total_applications || 0), 0);
  const totalApproved = rows.reduce((sum, row) => sum + Number(row.approved_applications || 0), 0);
  const totalPaid = rows.reduce((sum, row) => sum + Number(row.paid_seasons || 0), 0);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.28em] text-[#A259FF]">EPL Admin</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Player Application Database</h1>
          <p className="mt-3 text-white/65">
            Master record for all EPL player applications across every season.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <StatBadge label="Players" value={totalPlayers} />
          <StatBadge label="Applications" value={totalApplications} />
          <StatBadge label="Approved" value={totalApproved} />
          <StatBadge label="Paid Seasons" value={totalPaid} />
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left">
              <thead className="bg-white/[0.04]">
                <tr className="text-xs uppercase tracking-[0.2em] text-white/50">
                  <th className="px-4 py-4">Player</th>
                  <th className="px-4 py-4">Football Info</th>
                  <th className="px-4 py-4">Jersey</th>
                  <th className="px-4 py-4">Season(s)</th>
                  <th className="px-4 py-4">Totals</th>
                  <th className="px-4 py-4">Latest Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-black/40">
                {rows.map((row) => (
                  <tr key={row.player_key} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{row.player_name || "Unnamed Player"}</div>
                      <div className="mt-1 text-sm text-white/60">{row.email || "No email"}</div>
                      {row.phone ? <div className="mt-1 text-sm text-white/45">{row.phone}</div> : null}
                    </td>

                    <td className="px-4 py-4 text-sm text-white/75">
                      <div>{row.preferred_position || "—"}</div>
                      <div className="mt-1 text-white/45">
                        {row.secondary_position || "No secondary position"}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-white/75">
                      <div>{row.jersey_name || "—"}</div>
                      <div className="mt-1 text-white/45">
                        #{row.preferred_jersey_number_1 ?? "—"} / #{row.preferred_jersey_number_2 ?? "—"}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-white/75">
                      <div className="max-w-[240px] leading-6">{row.seasons || "—"}</div>
                    </td>

                    <td className="px-4 py-4 text-sm text-white/75">
                      <div>Total Applications: {row.total_applications}</div>
                      <div className="mt-1 text-white/45">Approved: {row.approved_applications}</div>
                      <div className="mt-1 text-white/45">Waitlisted: {row.waitlisted_applications}</div>
                      <div className="mt-1 text-white/45">Declined: {row.declined_applications}</div>
                      <div className="mt-1 text-white/45">Paid Seasons: {row.paid_seasons}</div>
                    </td>

                    <td className="px-4 py-4 text-sm text-white/75">
                      <div>
                        Last Applied:{" "}
                        {row.last_submitted_at
                          ? new Date(row.last_submitted_at).toLocaleString()
                          : "—"}
                      </div>
                      <div className="mt-1 text-white/45">
                        Last Paid:{" "}
                        {row.last_paid_at
                          ? new Date(row.last_paid_at).toLocaleString()
                          : "—"}
                      </div>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-white/55">
                      No EPL player applications yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
