import { NextRequest, NextResponse } from "next/server";
import { getPlatformViewer } from "@/lib/evntszn";
import { getWebOrigin } from "@/lib/domains";
import {
  buildNodePublicIdentifier,
  buildNodeSlug,
  normalizeNodeDestinationType,
  normalizeNodePulseMode,
  normalizeNodeStatus,
  normalizeNodeType,
} from "@/lib/nodes";
import { supabaseAdmin } from "@/lib/supabase-admin";

type NodePayload = {
  id?: string;
  slug?: string;
  internalName?: string;
  publicTitle?: string;
  nodeType?: string;
  status?: string;
  city?: string;
  state?: string;
  venueId?: string | null;
  eventId?: string | null;
  crewProfileId?: string | null;
  linkPageId?: string | null;
  campaignLabel?: string | null;
  placementLabel?: string | null;
  destinationType?: string;
  destinationPayload?: Record<string, unknown>;
  pulseMode?: string;
  shortCode?: string | null;
  notes?: string | null;
  assignedToUserId?: string | null;
};

async function buildUniqueNodeSlug(baseInput: string, currentId?: string) {
  const base = buildNodeSlug(baseInput, "node");
  for (let index = 0; index < 12; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const { data, error } = await supabaseAdmin
      .from("evntszn_nodes")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data || data.id === currentId) {
      return candidate;
    }
  }

  return `${base}-${Date.now().toString().slice(-4)}`;
}

async function buildUniqueNodePublicIdentifier(slug: string, currentId?: string) {
  const base = buildNodePublicIdentifier(slug);

  for (let index = 0; index < 12; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const { data, error } = await supabaseAdmin
      .from("evntszn_nodes")
      .select("id")
      .eq("public_identifier", candidate)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data || data.id === currentId) {
      return candidate;
    }
  }

  return `${base}-${Date.now().toString().slice(-4)}`;
}

function aggregateNodeAnalytics(
  rows: Array<{
    node_id: string;
    interaction_type: string;
    actor_user_id: string | null;
    session_key: string | null;
    interaction_fingerprint: string | null;
    created_at: string;
  }>,
) {
  const perNode = new Map<
    string,
    {
      totalInteractions: number;
      totalViews: number;
      totalTaps: number;
      totalReactions: number;
      uniqueInteractions: Set<string>;
      lastSeenAt: string | null;
    }
  >();

  for (const row of rows) {
    if (!perNode.has(row.node_id)) {
      perNode.set(row.node_id, {
        totalInteractions: 0,
        totalViews: 0,
        totalTaps: 0,
        totalReactions: 0,
        uniqueInteractions: new Set<string>(),
        lastSeenAt: null,
      });
    }

    const bucket = perNode.get(row.node_id)!;
    bucket.totalInteractions += 1;
    if (row.interaction_type === "view") bucket.totalViews += 1;
    if (row.interaction_type === "tap") bucket.totalTaps += 1;
    if (row.interaction_type === "reaction") bucket.totalReactions += 1;
    if (!bucket.lastSeenAt || new Date(row.created_at).getTime() > new Date(bucket.lastSeenAt).getTime()) {
      bucket.lastSeenAt = row.created_at;
    }

    const uniqueKey = row.actor_user_id || row.session_key || row.interaction_fingerprint || `${row.node_id}:${row.created_at}`;
    bucket.uniqueInteractions.add(uniqueKey);
  }

  return perNode;
}

export async function GET(request: NextRequest) {
  try {
    const viewer = await getPlatformViewer();
    if (!viewer.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() || "";
    const status = request.nextUrl.searchParams.get("status")?.trim() || "";
    const type = request.nextUrl.searchParams.get("type")?.trim() || "";
    const city = request.nextUrl.searchParams.get("city")?.trim() || "";

    let query = supabaseAdmin
      .from("evntszn_nodes")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(120);

    if (!viewer.isPlatformAdmin) {
      query = query.or(`owner_user_id.eq.${viewer.user.id},assigned_to_user_id.eq.${viewer.user.id}`);
    }
    if (status) query = query.eq("status", normalizeNodeStatus(status));
    if (type) query = query.eq("node_type", normalizeNodeType(type));
    if (city) query = query.ilike("city", `%${city}%`);

    const { data: nodes, error } = await query;
    if (error) throw new Error(error.message);

    const filteredNodes = (nodes || []).filter((node) => {
      if (!q) return true;
      return [
        node.internal_name,
        node.public_title,
        node.slug,
        node.city,
        node.state,
        node.campaign_label,
        node.placement_label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    const nodeIds = filteredNodes.map((node) => node.id);
    const [
      interactionsRes,
      eventsRes,
      venuesRes,
      crewRes,
      linksRes,
      assigneesRes,
    ] = await Promise.all([
      nodeIds.length
        ? supabaseAdmin
            .from("evntszn_node_interactions")
            .select("node_id, interaction_type, actor_user_id, session_key, interaction_fingerprint, created_at")
            .in("node_id", nodeIds)
            .gte("created_at", new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString())
        : Promise.resolve({ data: [], error: null }),
      supabaseAdmin
        .from("evntszn_events")
        .select("id, title, slug, city, state, start_at")
        .eq("visibility", "published")
        .order("start_at", { ascending: false })
        .limit(60),
      supabaseAdmin
        .from("evntszn_venues")
        .select("id, name, slug, city, state")
        .order("updated_at", { ascending: false })
        .limit(60),
      supabaseAdmin
        .from("evntszn_crew_profiles")
        .select("id, display_name, slug, city, state, status")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(60),
      supabaseAdmin
        .from("evntszn_link_pages")
        .select("id, display_name, slug, city, state, status")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(60),
      viewer.isPlatformAdmin
        ? supabaseAdmin
            .from("evntszn_profiles")
            .select("user_id, full_name, city, state")
            .order("updated_at", { ascending: false })
            .limit(60)
        : supabaseAdmin
            .from("evntszn_profiles")
            .select("user_id, full_name, city, state")
            .eq("user_id", viewer.user.id)
            .limit(1),
    ]);

    if (interactionsRes.error) throw new Error(interactionsRes.error.message);
    if (eventsRes.error) throw new Error(eventsRes.error.message);
    if (venuesRes.error) throw new Error(venuesRes.error.message);
    if (crewRes.error) throw new Error(crewRes.error.message);
    if (linksRes.error) throw new Error(linksRes.error.message);
    if (assigneesRes.error) throw new Error(assigneesRes.error.message);

    const analyticsMap = aggregateNodeAnalytics(interactionsRes.data || []);
    const eventMap = new Map((eventsRes.data || []).map((item) => [item.id, item]));
    const venueMap = new Map((venuesRes.data || []).map((item) => [item.id, item]));
    const crewMap = new Map((crewRes.data || []).map((item) => [item.id, item]));
    const linkMap = new Map((linksRes.data || []).map((item) => [item.id, item]));

    const hydratedNodes = filteredNodes.map((node) => {
      const analytics = analyticsMap.get(node.id);
      return {
        ...node,
        event: node.event_id ? eventMap.get(node.event_id) || null : null,
        venue: node.venue_id ? venueMap.get(node.venue_id) || null : null,
        crew: node.crew_profile_id ? crewMap.get(node.crew_profile_id) || null : null,
        link: node.link_page_id ? linkMap.get(node.link_page_id) || null : null,
        analytics: {
          totalViews: analytics?.totalViews || 0,
          totalTaps: analytics?.totalTaps || 0,
          totalReactions: analytics?.totalReactions || 0,
          uniqueInteractions: analytics?.uniqueInteractions.size || 0,
          lastSeenAt: node.last_seen_at || analytics?.lastSeenAt || null,
        },
      };
    });

    const summary = hydratedNodes.reduce(
      (acc, node) => {
        acc.totalNodes += 1;
        if (node.status === "active") acc.activeNodes += 1;
        acc.totalTaps += node.analytics.totalTaps;
        acc.totalViews += node.analytics.totalViews;
        if (node.analytics.lastSeenAt && new Date(node.analytics.lastSeenAt).getTime() >= Date.now() - 1000 * 60 * 60 * 24 * 2) {
          acc.liveNodes += 1;
        }
        return acc;
      },
      { totalNodes: 0, activeNodes: 0, totalTaps: 0, totalViews: 0, liveNodes: 0 },
    );

    return NextResponse.json({
      nodes: hydratedNodes,
      summary,
      options: {
        events: eventsRes.data || [],
        venues: venuesRes.data || [],
        crewProfiles: crewRes.data || [],
        linkPages: linksRes.data || [],
        assignees: assigneesRes.data || [],
      },
      viewer: {
        isPlatformAdmin: viewer.isPlatformAdmin,
        userId: viewer.user.id,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load EVNTSZN Nodes." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const viewer = await getPlatformViewer();
    if (!viewer.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as NodePayload;
    const existingId = String(body.id || "").trim() || null;
    const internalName = String(body.internalName || "").trim();
    if (!internalName) {
      return NextResponse.json({ error: "Internal name is required." }, { status: 400 });
    }

    const existingRes = existingId
      ? await supabaseAdmin.from("evntszn_nodes").select("*").eq("id", existingId).maybeSingle()
      : { data: null, error: null };
    if (existingRes.error) throw new Error(existingRes.error.message);
    if (existingRes.data && !viewer.isPlatformAdmin && existingRes.data.owner_user_id !== viewer.user.id) {
      return NextResponse.json({ error: "You can only edit your own nodes." }, { status: 403 });
    }

    const slug = await buildUniqueNodeSlug(body.slug || internalName, existingRes.data?.id);
    const publicIdentifier = await buildUniqueNodePublicIdentifier(slug, existingRes.data?.id);
    const requestHost = request.headers.get("x-forwarded-host") || new URL(request.url).host;
    const publicUrl = `${getWebOrigin(requestHost)}/nodes/${slug}`;

    const payload = {
      owner_user_id: existingRes.data?.owner_user_id || viewer.user.id,
      assigned_to_user_id: body.assignedToUserId || null,
      slug,
      public_identifier: publicIdentifier,
      internal_name: internalName,
      public_title: String(body.publicTitle || "").trim() || null,
      node_type: normalizeNodeType(body.nodeType),
      status: normalizeNodeStatus(body.status),
      city: String(body.city || "").trim() || null,
      state: String(body.state || "").trim() || null,
      venue_id: body.venueId || null,
      event_id: body.eventId || null,
      crew_profile_id: body.crewProfileId || null,
      link_page_id: body.linkPageId || null,
      campaign_label: String(body.campaignLabel || "").trim() || null,
      placement_label: String(body.placementLabel || "").trim() || null,
      destination_type: normalizeNodeDestinationType(body.destinationType),
      destination_payload: body.destinationPayload && typeof body.destinationPayload === "object" ? body.destinationPayload : {},
      pulse_mode: normalizeNodePulseMode(body.pulseMode),
      short_code: String(body.shortCode || "").trim() || null,
      qr_url: publicUrl,
      tap_url: publicUrl,
      public_url: publicUrl,
      notes: String(body.notes || "").trim() || null,
    };

    const { data, error } = await supabaseAdmin
      .from("evntszn_nodes")
      .upsert(existingId ? { id: existingId, ...payload } : payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ node: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save EVNTSZN Node." },
      { status: 500 },
    );
  }
}
