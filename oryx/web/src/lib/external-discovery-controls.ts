import type { TicketmasterEvent } from "@/lib/ticketmaster";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabasePublicServer } from "@/lib/supabase-public-server";
import { formatRuntimeError, getSupabaseRuntimeSnapshot, isSupabaseCredentialError } from "@/lib/runtime-env";

export type ExternalDiscoveryControl = {
  external_event_id: string;
  source: "ticketmaster" | "eventbrite";
  title: string | null;
  city: string | null;
  state: string | null;
  starts_at: string | null;
  status: "active" | "featured" | "deprioritized" | "hidden" | "unsuitable";
  priority_adjustment: number;
  override_title: string | null;
  override_summary: string | null;
  notes: string | null;
};

export type ModeratedExternalEvent = TicketmasterEvent & {
  moderationStatus: ExternalDiscoveryControl["status"];
  priorityAdjustment: number;
};

function isMissingExternalControlsTableError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message)
      : "";

  return code === "42P01" || code === "PGRST205" || /external_discovery_controls/i.test(message);
}

export async function getExternalDiscoveryControls(
  source: "ticketmaster" | "eventbrite",
  externalEventIds: string[],
) {
  if (!externalEventIds.length) return new Map<string, ExternalDiscoveryControl>();

  try {
    let { data, error } = await supabaseAdmin
      .from("external_discovery_controls")
      .select("external_event_id, source, title, city, state, starts_at, status, priority_adjustment, override_title, override_summary, notes")
      .eq("source", source)
      .in("external_event_id", externalEventIds);

    if (error && isSupabaseCredentialError(error)) {
      const fallbackResponse = await supabasePublicServer
        .from("external_discovery_controls")
        .select("external_event_id, source, title, city, state, starts_at, status, priority_adjustment, override_title, override_summary, notes")
        .eq("source", source)
        .in("external_event_id", externalEventIds);
      data = fallbackResponse.data;
      error = fallbackResponse.error;
    }

    if (error) {
      if (isMissingExternalControlsTableError(error)) {
        return new Map<string, ExternalDiscoveryControl>();
      }
      throw error;
    }

    return new Map<string, ExternalDiscoveryControl>(
      ((data || []) as ExternalDiscoveryControl[]).map((row) => [row.external_event_id, row]),
    );
  } catch (error) {
    console.error("[external-discovery] control load failed", {
      error: formatRuntimeError(error),
      source,
      supabase: getSupabaseRuntimeSnapshot(),
      credentialIssue: isSupabaseCredentialError(error),
    });
    return new Map<string, ExternalDiscoveryControl>();
  }
}

export async function applyExternalDiscoveryControls(
  source: "ticketmaster" | "eventbrite",
  events: TicketmasterEvent[],
) {
  const controls = await getExternalDiscoveryControls(
    source,
    events.map((event) => event.id),
  );

  return events
    .map<ModeratedExternalEvent | null>((event) => {
      const control = controls.get(event.id);
      if (control?.status === "hidden" || control?.status === "unsuitable") {
        return null;
      }

      return {
        ...event,
        title: control?.override_title || event.title,
        description: control?.override_summary || event.description,
        moderationStatus: control?.status || "active",
        priorityAdjustment: control?.priority_adjustment || 0,
      };
    })
    .filter((event): event is ModeratedExternalEvent => Boolean(event))
    .sort((a, b) => {
      const featuredDelta = Number(b.moderationStatus === "featured") - Number(a.moderationStatus === "featured");
      if (featuredDelta !== 0) return featuredDelta;

      const priorityDelta = (b.priorityAdjustment || 0) - (a.priorityAdjustment || 0);
      if (priorityDelta !== 0) return priorityDelta;

      const deprioritizedDelta = Number(a.moderationStatus === "deprioritized") - Number(b.moderationStatus === "deprioritized");
      if (deprioritizedDelta !== 0) return deprioritizedDelta;

      return 0;
    });
}
