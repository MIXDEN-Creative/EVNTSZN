import { supabaseAdmin } from "@/lib/supabase-admin";

export const CREATOR_KICKOFF_SLUG = "the-creator-kickoff";
export const MIDNIGHT_RUN_SLUG = "evntszn-midnight-run";

export const CREATOR_KICKOFF_DESCRIPTION = `Hey Baltimore,

This is where connections actually happen.

The Creator Kickoff is a curated networking experience bringing together creators, entrepreneurs, and ambitious individuals who are serious about building, collaborating, and leveling up.

No awkward small talk. No wasted time.

Just real conversations, real opportunities, and the kind of room where one connection can open the next door.

If you’re ready to be in the right environment with the right people, this is where you need to be. 21+ event.`;

const CREATOR_KICKOFF_START_AT = "2026-05-01T23:00:00.000Z";
const CREATOR_KICKOFF_END_AT = "2026-05-02T03:30:00.000Z";

const CREATOR_KICKOFF_TIER_BLUEPRINTS = [
  {
    name: "Early Bird Access",
    description: "Fast-entry access for the first release.",
    price_usd: 8,
    quantity_total: 125,
    max_per_order: 6,
    sales_start_at: null,
    sales_end_at: "2026-04-17T04:00:00.000Z",
    sort_order: 1,
  },
  {
    name: "General Admission",
    description: "Standard event access once early release closes.",
    price_usd: 15,
    quantity_total: 250,
    max_per_order: 6,
    sales_start_at: "2026-04-17T04:00:00.000Z",
    sales_end_at: "2026-05-01T23:00:00.000Z",
    sort_order: 2,
  },
  {
    name: "At The Door",
    description: "Door release if capacity remains at event start.",
    price_usd: 20,
    quantity_total: 75,
    max_per_order: 4,
    sales_start_at: "2026-05-01T23:00:00.000Z",
    sales_end_at: null,
    sort_order: 3,
  },
] as const;

type CreatorKickoffRuntimeTicket = {
  id: string;
  name: string;
  description: string | null;
  quantity_total: number;
  quantity_sold: number;
  max_per_order: number;
  sales_start_at: string | null;
  sales_end_at: string | null;
  is_active: boolean;
  price_usd: number;
  visibility_mode: "visible";
  sort_order: number;
};

export function isCreatorKickoffEvent(input: { slug?: string | null; title?: string | null }) {
  return input.slug === CREATOR_KICKOFF_SLUG || /creator kickoff/i.test(String(input.title || ""));
}

export function isMidnightRunEvent(input: { slug?: string | null; title?: string | null }) {
  return input.slug === MIDNIGHT_RUN_SLUG || /midnight run/i.test(String(input.title || ""));
}

export async function ensureCreatorKickoffRuntimeSetup(eventId: string) {
  await supabaseAdmin
    .from("evntszn_events")
    .update({
      start_at: CREATOR_KICKOFF_START_AT,
      end_at: CREATOR_KICKOFF_END_AT,
      description: CREATOR_KICKOFF_DESCRIPTION,
      visibility: "published",
      status: "published",
    })
    .eq("id", eventId);

  const { data: currentRows, error: currentError } = await supabaseAdmin
    .from("evntszn_ticket_types")
    .select("id, name")
    .eq("event_id", eventId);

  if (currentError) {
    throw new Error(currentError.message);
  }

  const currentByName = new Map((currentRows || []).map((row) => [row.name, row]));
  const validNames = new Set(CREATOR_KICKOFF_TIER_BLUEPRINTS.map((tier) => tier.name));

  for (const tier of CREATOR_KICKOFF_TIER_BLUEPRINTS) {
    const existing = currentByName.get(tier.name);
    if (existing) {
      await supabaseAdmin
        .from("evntszn_ticket_types")
        .update({
          description: tier.description,
          quantity_total: tier.quantity_total,
          max_per_order: tier.max_per_order,
          sales_start_at: tier.sales_start_at,
          sales_end_at: tier.sales_end_at,
          is_active: true,
        })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin
        .from("evntszn_ticket_types")
        .insert({
          event_id: eventId,
          name: tier.name,
          description: tier.description,
          quantity_total: tier.quantity_total,
          quantity_sold: 0,
          max_per_order: tier.max_per_order,
          sales_start_at: tier.sales_start_at,
          sales_end_at: tier.sales_end_at,
          is_active: true,
        });
    }
  }

  const staleIds = (currentRows || [])
    .filter((row) => !validNames.has(row.name))
    .map((row) => row.id);

  if (staleIds.length) {
    await supabaseAdmin
      .from("evntszn_ticket_types")
      .update({ is_active: false })
      .in("id", staleIds);
  }

  const { data: syncedRows, error: syncedError } = await supabaseAdmin
    .from("evntszn_ticket_types")
    .select("id, name, description, quantity_total, quantity_sold, max_per_order, sales_start_at, sales_end_at, is_active")
    .eq("event_id", eventId)
    .order("sales_start_at", { ascending: true, nullsFirst: true });

  if (syncedError) {
    throw new Error(syncedError.message);
  }

  return CREATOR_KICKOFF_TIER_BLUEPRINTS.map<CreatorKickoffRuntimeTicket | null>((tier) => {
    const row = (syncedRows || []).find((entry) => entry.name === tier.name);
    if (!row) {
      return null;
    }

    return {
      ...row,
      price_usd: tier.price_usd,
      visibility_mode: "visible" as const,
      sort_order: tier.sort_order,
    };
  }).filter((row): row is CreatorKickoffRuntimeTicket => row !== null);
}
