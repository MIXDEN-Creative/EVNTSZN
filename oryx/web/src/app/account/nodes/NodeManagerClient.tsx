"use client";

import { useEffect, useMemo, useState } from "react";
import {
  NODE_DESTINATION_TYPES,
  NODE_PULSE_MODES,
  NODE_STATUSES,
  NODE_TYPES,
  getNodeStatusTone,
  getNodeTypeLabel,
  type NodeDestinationType,
  type NodePulseMode,
  type NodeStatus,
  type NodeType,
} from "@/lib/nodes";

type NodeOption = {
  id: string;
  title?: string | null;
  slug?: string | null;
  name?: string | null;
  display_name?: string | null;
  city?: string | null;
  state?: string | null;
  full_name?: string | null;
  user_id?: string;
};

type NodeRow = {
  id: string;
  slug: string;
  public_identifier: string | null;
  internal_name: string;
  public_title: string | null;
  node_type: NodeType;
  status: NodeStatus;
  city: string | null;
  state: string | null;
  venue_id: string | null;
  event_id: string | null;
  crew_profile_id: string | null;
  link_page_id: string | null;
  campaign_label: string | null;
  placement_label: string | null;
  destination_type: NodeDestinationType;
  destination_payload: Record<string, unknown>;
  pulse_mode: NodePulseMode;
  short_code: string | null;
  public_url: string | null;
  notes: string | null;
  assigned_to_user_id: string | null;
  analytics: {
    totalViews: number;
    totalTaps: number;
    totalReactions: number;
    uniqueInteractions: number;
    lastSeenAt: string | null;
  };
  event?: { id: string; title: string; slug: string } | null;
  venue?: { id: string; name: string; slug: string } | null;
  crew?: { id: string; display_name: string; slug: string } | null;
  link?: { id: string; display_name: string | null; slug: string } | null;
};

type Payload = {
  nodes: NodeRow[];
  summary: {
    totalNodes: number;
    activeNodes: number;
    totalTaps: number;
    totalViews: number;
    liveNodes: number;
  };
  options: {
    events: NodeOption[];
    venues: NodeOption[];
    crewProfiles: NodeOption[];
    linkPages: NodeOption[];
    assignees: NodeOption[];
  };
};

type Draft = {
  id?: string;
  internalName: string;
  publicTitle: string;
  slug: string;
  nodeType: NodeType;
  status: NodeStatus;
  city: string;
  state: string;
  eventId: string;
  venueId: string;
  crewProfileId: string;
  linkPageId: string;
  campaignLabel: string;
  placementLabel: string;
  destinationType: NodeDestinationType;
  destinationUrl: string;
  pulseMode: NodePulseMode;
  shortCode: string;
  assignedToUserId: string;
  notes: string;
};

const EMPTY_DRAFT: Draft = {
  internalName: "",
  publicTitle: "",
  slug: "",
  nodeType: "event_node",
  status: "draft",
  city: "",
  state: "",
  eventId: "",
  venueId: "",
  crewProfileId: "",
  linkPageId: "",
  campaignLabel: "",
  placementLabel: "",
  destinationType: "event",
  destinationUrl: "",
  pulseMode: "inherit",
  shortCode: "",
  assignedToUserId: "",
  notes: "",
};

function buildDraftFromNode(node: NodeRow): Draft {
  return {
    id: node.id,
    internalName: node.internal_name,
    publicTitle: node.public_title || "",
    slug: node.slug,
    nodeType: node.node_type,
    status: node.status,
    city: node.city || "",
    state: node.state || "",
    eventId: node.event_id || "",
    venueId: node.venue_id || "",
    crewProfileId: node.crew_profile_id || "",
    linkPageId: node.link_page_id || "",
    campaignLabel: node.campaign_label || "",
    placementLabel: node.placement_label || "",
    destinationType: node.destination_type,
    destinationUrl: String((node.destination_payload || {}).url || ""),
    pulseMode: node.pulse_mode,
    shortCode: node.short_code || "",
    assignedToUserId: node.assigned_to_user_id || "",
    notes: node.notes || "",
  };
}

export default function NodeManagerClient() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [filters, setFilters] = useState({ q: "", status: "", type: "", city: "" });

  async function load(nextSelectedId?: string | null) {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    if (filters.city) params.set("city", filters.city);

    const res = await fetch(`/api/evntszn/nodes${params.toString() ? `?${params.toString()}` : ""}`, { cache: "no-store" });
    const json = (await res.json()) as Payload & { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not load EVNTSZN Nodes.");
      return;
    }
    setPayload(json);
    const fallbackSelectedId = nextSelectedId || selectedId || json.nodes[0]?.id || null;
    setSelectedId(fallbackSelectedId);
    const selectedNode = json.nodes.find((node) => node.id === fallbackSelectedId) || null;
    setDraft(selectedNode ? buildDraftFromNode(selectedNode) : EMPTY_DRAFT);
    setMessage(null);
  }

  useEffect(() => {
    void load();
  }, []);

  const selectedNode = useMemo(
    () => payload?.nodes.find((node) => node.id === selectedId) || null,
    [payload, selectedId],
  );

  useEffect(() => {
    if (selectedNode) {
      setDraft(buildDraftFromNode(selectedNode));
    }
  }, [selectedNode?.id]);

  async function saveNode() {
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/evntszn/nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: draft.id,
        internalName: draft.internalName,
        publicTitle: draft.publicTitle,
        slug: draft.slug,
        nodeType: draft.nodeType,
        status: draft.status,
        city: draft.city,
        state: draft.state,
        eventId: draft.eventId || null,
        venueId: draft.venueId || null,
        crewProfileId: draft.crewProfileId || null,
        linkPageId: draft.linkPageId || null,
        campaignLabel: draft.campaignLabel || null,
        placementLabel: draft.placementLabel || null,
        destinationType: draft.destinationType,
        destinationPayload: draft.destinationUrl ? { url: draft.destinationUrl } : {},
        pulseMode: draft.pulseMode,
        shortCode: draft.shortCode || null,
        assignedToUserId: draft.assignedToUserId || null,
        notes: draft.notes || null,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as { error?: string; node?: { id: string } };
    if (!res.ok) {
      setMessage(json.error || "Could not save node.");
      setSaving(false);
      return;
    }

    await load(json.node?.id || draft.id || null);
    setSaving(false);
    setMessage("EVNTSZN Node saved.");
  }

  function startNewNode() {
    setSelectedId(null);
    setDraft(EMPTY_DRAFT);
    setMessage(null);
  }

  return (
    <div className="space-y-8">
      {message ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">{message}</div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="ev-meta-card">
          <div className="ev-meta-label">Total nodes</div>
          <div className="ev-meta-value">{payload?.summary.totalNodes || 0}</div>
        </div>
        <div className="ev-meta-card">
          <div className="ev-meta-label">Active now</div>
          <div className="ev-meta-value">{payload?.summary.activeNodes || 0}</div>
        </div>
        <div className="ev-meta-card">
          <div className="ev-meta-label">Total taps</div>
          <div className="ev-meta-value">{payload?.summary.totalTaps || 0}</div>
        </div>
        <div className="ev-meta-card">
          <div className="ev-meta-label">Live nodes</div>
          <div className="ev-meta-value">{payload?.summary.liveNodes || 0}</div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <div className="ev-panel p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="ev-section-kicker">Node network</div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-white">All nodes</h2>
              </div>
              <button type="button" onClick={startNewNode} className="ev-button-primary">
                New node
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <input
                value={filters.q}
                onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
                className="ev-field"
                placeholder="Search nodes"
              />
              <input
                value={filters.city}
                onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}
                className="ev-field"
                placeholder="Filter by city"
              />
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                className="ev-field"
              >
                <option value="">All statuses</option>
                {NODE_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select
                value={filters.type}
                onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
                className="ev-field"
              >
                <option value="">All node types</option>
                {NODE_TYPES.map((type) => (
                  <option key={type} value={type}>{getNodeTypeLabel(type)}</option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => void load()} className="ev-button-secondary">Apply filters</button>
              <button type="button" onClick={() => { setFilters({ q: "", status: "", type: "", city: "" }); setTimeout(() => void load(), 0); }} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/72 transition hover:bg-white/10">
                Reset
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {(payload?.nodes || []).map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedId(node.id)}
                  className={`w-full rounded-[26px] border p-4 text-left transition ${selectedId === node.id ? "border-[#A259FF]/30 bg-[#A259FF]/10" : "border-white/10 bg-black/20 hover:bg-white/[0.04]"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-white/42">{getNodeTypeLabel(node.node_type)}</div>
                      <div className="mt-2 text-lg font-black text-white">{node.public_title || node.internal_name}</div>
                      <div className="mt-1 text-sm text-white/55">/{node.slug}</div>
                    </div>
                    <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getNodeStatusTone(node.status)}`}>
                      {node.status}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/42">Views</div>
                      <div className="mt-2 text-lg font-bold text-white">{node.analytics.totalViews}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/42">Taps</div>
                      <div className="mt-2 text-lg font-bold text-white">{node.analytics.totalTaps}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/42">Last seen</div>
                      <div className="mt-2 text-sm font-semibold text-white">{node.analytics.lastSeenAt ? new Date(node.analytics.lastSeenAt).toLocaleString() : "No activity"}</div>
                    </div>
                  </div>
                </button>
              ))}

              {!payload?.nodes?.length ? (
                <div className="rounded-[24px] border border-dashed border-white/12 bg-black/20 p-5 text-sm text-white/60">
                  No nodes yet. Create a venue, event, area, crew, or campaign node and publish it when it is ready to receive traffic.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="ev-panel p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="ev-section-kicker">Node detail</div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                  {draft.id ? "Edit node" : "Create node"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/64">
                  Choose what this node is, where it lives, and what it should open when someone taps or scans it.
                </p>
              </div>
              {selectedNode?.public_url ? (
                <a href={selectedNode.public_url} target="_blank" rel="noreferrer" className="ev-button-secondary">
                  Open public node
                </a>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">Internal name</label>
                <input value={draft.internalName} onChange={(event) => setDraft((current) => ({ ...current, internalName: event.target.value }))} className="ev-field" placeholder="Baltimore venue foyer node" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">Public title</label>
                <input value={draft.publicTitle} onChange={(event) => setDraft((current) => ({ ...current, publicTitle: event.target.value }))} className="ev-field" placeholder="What’s live at this stop?" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">Slug</label>
                <input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} className="ev-field" placeholder="fells-point-friday-node" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">Short code</label>
                <input value={draft.shortCode} onChange={(event) => setDraft((current) => ({ ...current, shortCode: event.target.value }))} className="ev-field" placeholder="BALT-01" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">Node type</label>
                <select value={draft.nodeType} onChange={(event) => setDraft((current) => ({ ...current, nodeType: event.target.value as NodeType }))} className="ev-field">
                  {NODE_TYPES.map((type) => (
                    <option key={type} value={type}>{getNodeTypeLabel(type)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">Status</label>
                <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as NodeStatus }))} className="ev-field">
                  {NODE_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">City</label>
                <input value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} className="ev-field" placeholder="Baltimore" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">State</label>
                <input value={draft.state} onChange={(event) => setDraft((current) => ({ ...current, state: event.target.value }))} className="ev-field" placeholder="MD" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">Campaign</label>
                <input value={draft.campaignLabel} onChange={(event) => setDraft((current) => ({ ...current, campaignLabel: event.target.value }))} className="ev-field" placeholder="Spring nightlife launch" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">Placement</label>
                <input value={draft.placementLabel} onChange={(event) => setDraft((current) => ({ ...current, placementLabel: event.target.value }))} className="ev-field" placeholder="Front bar, poster rail, QR stand" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">Destination mode</label>
                <select value={draft.destinationType} onChange={(event) => setDraft((current) => ({ ...current, destinationType: event.target.value as NodeDestinationType }))} className="ev-field">
                  {NODE_DESTINATION_TYPES.map((type) => (
                    <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">Pulse mode</label>
                <select value={draft.pulseMode} onChange={(event) => setDraft((current) => ({ ...current, pulseMode: event.target.value as NodePulseMode }))} className="ev-field">
                  {NODE_PULSE_MODES.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">Linked event</label>
                <select value={draft.eventId} onChange={(event) => setDraft((current) => ({ ...current, eventId: event.target.value }))} className="ev-field">
                  <option value="">No event linked</option>
                  {(payload?.options.events || []).map((event) => (
                    <option key={event.id} value={event.id}>{event.title} {event.city ? `· ${event.city}` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">Linked venue</label>
                <select value={draft.venueId} onChange={(event) => setDraft((current) => ({ ...current, venueId: event.target.value }))} className="ev-field">
                  <option value="">No venue linked</option>
                  {(payload?.options.venues || []).map((venue) => (
                    <option key={venue.id} value={venue.id}>{venue.name} {venue.city ? `· ${venue.city}` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">Linked crew</label>
                <select value={draft.crewProfileId} onChange={(event) => setDraft((current) => ({ ...current, crewProfileId: event.target.value }))} className="ev-field">
                  <option value="">No crew profile linked</option>
                  {(payload?.options.crewProfiles || []).map((crew) => (
                    <option key={crew.id} value={crew.id}>{crew.display_name} {crew.city ? `· ${crew.city}` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">Linked EVNTSZN Link</label>
                <select value={draft.linkPageId} onChange={(event) => setDraft((current) => ({ ...current, linkPageId: event.target.value }))} className="ev-field">
                  <option value="">No Link page linked</option>
                  {(payload?.options.linkPages || []).map((page) => (
                    <option key={page.id} value={page.id}>{page.display_name || page.slug}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">Assigned to</label>
                <select value={draft.assignedToUserId} onChange={(event) => setDraft((current) => ({ ...current, assignedToUserId: event.target.value }))} className="ev-field">
                  <option value="">Unassigned</option>
                  {(payload?.options.assignees || []).map((assignee) => (
                    <option key={assignee.user_id} value={assignee.user_id}>{assignee.full_name || assignee.user_id}</option>
                  ))}
                </select>
              </div>
            </div>

            {draft.destinationType === "custom_url" ? (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-white/70">Custom destination URL</label>
                <input value={draft.destinationUrl} onChange={(event) => setDraft((current) => ({ ...current, destinationUrl: event.target.value }))} className="ev-field" placeholder="https://..." />
              </div>
            ) : null}

            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-white/70">Ops notes</label>
              <textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} className="ev-field min-h-[120px]" placeholder="Where this node is installed, what campaign it belongs to, and why it exists." />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={saveNode} disabled={saving} className="ev-button-primary disabled:opacity-60">
                {saving ? "Saving..." : "Save node"}
              </button>
              {selectedNode?.public_url ? (
                <a href={selectedNode.public_url} target="_blank" rel="noreferrer" className="ev-button-secondary">
                  Open public URL
                </a>
              ) : null}
            </div>
          </div>

          {selectedNode ? (
            <div className="ev-panel p-5 md:p-6">
              <div className="ev-section-kicker">Live analytics</div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">{selectedNode.public_title || selectedNode.internal_name}</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Views</div>
                  <div className="mt-2 text-2xl font-black text-white">{selectedNode.analytics.totalViews}</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Taps</div>
                  <div className="mt-2 text-2xl font-black text-white">{selectedNode.analytics.totalTaps}</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Reactions</div>
                  <div className="mt-2 text-2xl font-black text-white">{selectedNode.analytics.totalReactions}</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Unique traffic</div>
                  <div className="mt-2 text-2xl font-black text-white">{selectedNode.analytics.uniqueInteractions}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
