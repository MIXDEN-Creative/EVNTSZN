import Link from "next/link";
import SeasonOneAdminClient from "./SeasonOneAdminClient";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";
import { buildWaiverUrl, getBaseWaiverUrl } from "@/lib/epl/waiver";

type PlayerApplicationRow = {
  id: string;
  season_id: string | null;
  player_profile_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  status: string | null;
  pipeline_stage: string | null;
  submitted_at: string | null;
  headshot_storage_path: string | null;
  jersey_name_requested: string | null;
  preferred_jersey_number_1: number | null;
  preferred_jersey_number_2: number | null;
  internal_notes: string | null;
  assigned_reviewer_user_id: string | null;
  answers: Record<string, unknown> | null;
};

type SeasonRegistrationRow = {
  id: string;
  application_id: string | null;
  player_profile_id: string | null;
  registration_status: string | null;
  player_status: string | null;
  payment_amount_usd: number | null;
  waived_fee: boolean | null;
  registration_code: string | null;
  stripe_checkout_session_id: string | null;
  updated_at: string | null;
};

type PlayerPoolRow = {
  application_id: string | null;
  player_profile_id: string | null;
  assigned_to_team: boolean | null;
  draft_eligible: boolean | null;
  draft_eligibility_reason: string | null;
};

type WaiverWebhookIssue = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  match_status: string;
  notes: string | null;
  candidate_application_ids: string[] | null;
  created_at: string | null;
};

export default async function EPLSeasonOneAdminPage() {
  await requireAdminPermission("approvals.manage", "/epl/admin/season-1");
  const supabase = getSupabaseAdmin();
  const baseWaiverUrl = getBaseWaiverUrl();

  const [
    { data: applications, error: applicationsError },
    { data: registrations, error: registrationsError },
    { data: playerPool, error: playerPoolError },
    { data: reviewerRows, error: reviewerError },
    { data: waiverIssues, error: waiverIssuesError },
  ] =
    await Promise.all([
      supabase
        .schema("epl")
        .from("player_applications")
        .select("id, season_id, player_profile_id, first_name, last_name, email, city, state, status, pipeline_stage, submitted_at, headshot_storage_path, jersey_name_requested, preferred_jersey_number_1, preferred_jersey_number_2, internal_notes, assigned_reviewer_user_id, answers")
        .order("submitted_at", { ascending: false }),
      supabase
        .schema("epl")
        .from("season_registrations")
        .select("id, application_id, player_profile_id, registration_status, player_status, payment_amount_usd, waived_fee, registration_code, stripe_checkout_session_id, updated_at")
        .order("updated_at", { ascending: false }),
      supabase
        .from("epl_v_admin_player_pool")
        .select("application_id, player_profile_id, assigned_to_team, draft_eligible, draft_eligibility_reason"),
      supabase
        .from("evntszn_profiles")
        .select("user_id, full_name")
        .eq("is_active", true)
        .order("full_name", { ascending: true }),
      supabase
        .schema("epl")
        .from("waiver_webhook_submissions")
        .select("id, email, first_name, last_name, match_status, notes, candidate_application_ids, created_at")
        .in("match_status", ["ambiguous", "unmatched"])
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

  const error = applicationsError || registrationsError || playerPoolError || reviewerError || waiverIssuesError;
  if (error) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-red-500/30 bg-red-500/10 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-red-200/80">EPL Admin Error</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">The Season 1 player desk could not load.</h1>
          <p className="mt-3 text-sm text-red-100/80">{error.message}</p>
        </div>
      </main>
    );
  }

  const registrationByApplicationId = new Map<string, SeasonRegistrationRow>();
  for (const registration of (registrations || []) as SeasonRegistrationRow[]) {
    if (registration.application_id) {
      registrationByApplicationId.set(registration.application_id, registration);
    }
  }

  const poolByApplicationId = new Map<string, PlayerPoolRow>();
  for (const row of (playerPool || []) as PlayerPoolRow[]) {
    if (row.application_id) {
      poolByApplicationId.set(row.application_id, row);
    }
  }

  const rows = ((applications || []) as PlayerApplicationRow[]).map((application) => {
    const registration = registrationByApplicationId.get(application.id) || null;
    const pool = poolByApplicationId.get(application.id) || null;
    const answers = (application.answers || {}) as Record<string, unknown>;
    const waiverStatus = String(answers.waiverStatus || "pending");
    const storedWaiverUrl = String(answers.waiverUrl || "");
    const waiverUrl =
      storedWaiverUrl && storedWaiverUrl !== baseWaiverUrl
        ? storedWaiverUrl
        : buildWaiverUrl({
        applicationId: application.id,
        registrationId: registration?.id || null,
        registrationCode: registration?.registration_code || null,
        playerProfileId: application.player_profile_id,
        seasonId: application.season_id,
        email: application.email,
        firstName: application.first_name,
        lastName: application.last_name,
      });
    const hasHeadshot = Boolean(application.headshot_storage_path);
    const hasJerseyDetails = Boolean(
      application.jersey_name_requested &&
      application.preferred_jersey_number_1 !== null &&
      application.preferred_jersey_number_2 !== null,
    );
    const paymentComplete = Boolean(
      registration && (registration.registration_status === "paid" || registration.waived_fee || registration.registration_status === "approved"),
    );

    return {
      application,
      registration,
      pool,
      waiverStatus,
      waiverUrl,
      hasHeadshot,
      hasJerseyDetails,
      paymentComplete,
    };
  });

  const stats = {
    total: rows.length,
    photoReady: rows.filter((row) => row.hasHeadshot).length,
    paymentReady: rows.filter((row) => row.paymentComplete).length,
    draftable: rows.filter((row) => row.pool?.draft_eligible).length,
    assigned: rows.filter((row) => row.application.assigned_reviewer_user_id).length,
    waiverExceptions: ((waiverIssues || []) as WaiverWebhookIssue[]).length,
  };

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#A259FF]">Season 1 player desk</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Registration, review, and draft readiness</h1>
            <p className="mt-3 max-w-3xl text-white/65">
              Track each player from submitted registration through waiver, payment, draft readiness, and team assignment. Approvals stays available for queue review, but this desk now handles registration-stage operations directly.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Ops actions</div>
            <div className="mt-4 grid gap-3">
              <Link href="/epl/admin/approvals" className="ev-button-primary">Open EPL player queue</Link>
              <Link href="/epl/admin/draft" className="ev-button-secondary">Open draft console</Link>
              <a href="/epl/draft/season-1" target="_blank" rel="noreferrer" className="ev-button-secondary">Open live draftboard</a>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Registrations", stats.total],
            ["Owned", stats.assigned],
            ["Photo ready", stats.photoReady],
            ["Payment ready", stats.paymentReady],
            ["Draftable", stats.draftable],
            ["Waiver exceptions", stats.waiverExceptions],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">{label}</div>
              <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
            </div>
          ))}
        </div>

        <SeasonOneAdminClient
          rows={rows}
          reviewers={((reviewerRows || []) as Array<{ user_id: string; full_name: string | null }>).map((row) => ({
            userId: row.user_id,
            fullName: row.full_name || null,
          }))}
          waiverIssues={(waiverIssues || []) as WaiverWebhookIssue[]}
        />
      </div>
    </main>
  );
}
