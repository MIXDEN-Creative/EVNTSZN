"use client";

import { useMemo, useState } from "react";
import { formatUsd } from "@/lib/money";
import { Select } from "@/components/ui/select";
import { normalizePipelineStatus } from "@/lib/pipeline-value";

type PipelineStatus = "new" | "reviewing" | "contacted" | "converted" | "closed";

type ApplicationRow = {
  id: string;
  kind: "stayops" | "sponsor";
  name: string;
  company?: string | null;
  valueLabel: string;
  estimatedValueUsd: number;
  city: string;
  status: PipelineStatus;
  createdAt?: string | null;
};

const STATUS_OPTIONS: PipelineStatus[] = ["new", "reviewing", "contacted", "converted", "closed"];
const TYPE_OPTIONS = ["all", "stayops", "sponsors"] as const;
const SORT_OPTIONS = ["newest", "highest_value"] as const;

function formatStatusLabel(value: PipelineStatus) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function StatusBadge({ status }: { status: PipelineStatus }) {
  const tone =
    status === "new"
      ? "border-[#A259FF]/25 bg-[#A259FF]/10 text-[#eadcff]"
      : status === "reviewing"
        ? "border-sky-400/25 bg-sky-400/10 text-sky-100"
        : status === "contacted"
          ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
          : status === "converted"
            ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
            : "border-white/12 bg-white/[0.05] text-white/70";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${tone}`}>
      {formatStatusLabel(status)}
    </span>
  );
}

function ListRow({
  row,
  onStatusChange,
  updating,
}: {
  row: ApplicationRow;
  onStatusChange: (row: ApplicationRow, status: PipelineStatus) => Promise<void>;
  updating: boolean;
}) {
  return (
    <div className="grid gap-3 rounded-[24px] border border-white/10 bg-black/25 px-5 py-4 md:grid-cols-[1.2fr_0.7fr_0.7fr_auto_auto_auto] md:items-center">
      <div>
        <div className="text-base font-bold text-white">{row.name}</div>
        {row.company ? <div className="mt-1 text-sm text-white/52">{row.company}</div> : null}
      </div>
      <div className="text-sm text-white/72">{row.valueLabel}</div>
      <div className="text-sm text-white/72">{row.city}</div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={updating || row.status === "contacted"}
          onClick={() => void onStatusChange(row, "contacted")}
          className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-100 disabled:opacity-50"
        >
          Mark Contacted
        </button>
        <button
          type="button"
          disabled={updating || row.status === "converted"}
          onClick={() => void onStatusChange(row, "converted")}
          className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100 disabled:opacity-50"
        >
          Mark Converted
        </button>
      </div>
      <div className="md:justify-self-end">
        <StatusBadge status={row.status} />
      </div>
      <div className="min-w-[170px]">
        <Select
          value={row.status}
          disabled={updating}
          onChange={(event) => void onStatusChange(row, event.target.value as PipelineStatus)}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {updating && row.status === status ? "Updating..." : formatStatusLabel(status)}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

export default function OperateApplicationsClient({
  initialStayOps,
  initialSponsors,
}: {
  initialStayOps: ApplicationRow[];
  initialSponsors: ApplicationRow[];
}) {
  const [stayOps, setStayOps] = useState(initialStayOps);
  const [sponsors, setSponsors] = useState(initialSponsors);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_OPTIONS)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PipelineStatus>("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]>("newest");

  const allRows = useMemo(() => [...stayOps, ...sponsors], [stayOps, sponsors]);
  const cityOptions = useMemo(() => {
    return Array.from(new Set(allRows.map((row) => row.city).filter(Boolean))).sort((left, right) => left.localeCompare(right));
  }, [allRows]);

  const visibleRows = useMemo(() => {
    const filtered = allRows.filter((row) => {
      if (typeFilter === "stayops" && row.kind !== "stayops") return false;
      if (typeFilter === "sponsors" && row.kind !== "sponsor") return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (cityFilter !== "all" && row.city !== cityFilter) return false;
      return true;
    });

    return filtered.sort((left, right) => {
      if (sortBy === "highest_value") {
        return Number(right.estimatedValueUsd || 0) - Number(left.estimatedValueUsd || 0);
      }
      return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
    });
  }, [allRows, cityFilter, sortBy, statusFilter, typeFilter]);

  const visibleStayOps = useMemo(() => visibleRows.filter((row) => row.kind === "stayops"), [visibleRows]);
  const visibleSponsors = useMemo(() => visibleRows.filter((row) => row.kind === "sponsor"), [visibleRows]);

  const totalPipelineValue = useMemo(() => {
    return visibleRows
      .filter((row) => normalizePipelineStatus(row.status) !== "closed")
      .reduce((sum, row) => sum + Number(row.estimatedValueUsd || 0), 0);
  }, [visibleRows]);

  const stayOpsPipelineValue = useMemo(() => {
    return visibleStayOps
      .filter((row) => row.status !== "closed")
      .reduce((sum, row) => sum + Number(row.estimatedValueUsd || 0), 0);
  }, [visibleStayOps]);

  const sponsorPipelineValue = useMemo(() => {
    return visibleSponsors
      .filter((row) => row.status !== "closed")
      .reduce((sum, row) => sum + Number(row.estimatedValueUsd || 0), 0);
  }, [visibleSponsors]);

  const newCount = useMemo(() => visibleRows.filter((row) => row.status === "new").length, [visibleRows]);
  const contactedCount = useMemo(() => visibleRows.filter((row) => row.status === "contacted").length, [visibleRows]);
  const convertedCount = useMemo(() => visibleRows.filter((row) => row.status === "converted").length, [visibleRows]);

  async function handleStatusChange(row: ApplicationRow, nextStatus: PipelineStatus) {
    const previousStatus = row.status;
    setUpdatingId(row.id);
    setMessage(null);

    const updateList = row.kind === "stayops" ? setStayOps : setSponsors;
    updateList((current) => current.map((entry) => (entry.id === row.id ? { ...entry, status: nextStatus } : entry)));

    const response = await fetch("/api/admin/operate-applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: row.id,
        kind: row.kind,
        status: nextStatus,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      updateList((current) => current.map((entry) => (entry.id === row.id ? { ...entry, status: previousStatus } : entry)));
      setMessage(payload.error || "Could not update application status.");
      setUpdatingId(null);
      return;
    }

    setMessage(`${row.name} moved to ${formatStatusLabel(nextStatus)}.`);
    setUpdatingId(null);
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[30px] border border-white/10 bg-black/35 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="ev-meta-card">
            <div className="ev-meta-label">Total pipeline value</div>
            <div className="ev-meta-value">{formatUsd(totalPipelineValue)}</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">StayOps pipeline</div>
            <div className="ev-meta-value">{formatUsd(stayOpsPipelineValue)}</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Sponsor pipeline</div>
            <div className="ev-meta-value">{formatUsd(sponsorPipelineValue)}</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">New applications</div>
            <div className="ev-meta-value">{newCount}</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Contacted</div>
            <div className="ev-meta-value">{contactedCount}</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Converted</div>
            <div className="ev-meta-value">{convertedCount}</div>
          </div>
        </div>
        {message ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
            {message}
          </div>
        ) : null}
      </section>

      <section className="rounded-[30px] border border-white/10 bg-black/35 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Filters</div>
            <div className="mt-2 text-sm text-white/58">Type, status, city, and sort stay visible so operators can move the pipeline fast.</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as (typeof TYPE_OPTIONS)[number])}>
              {TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type === "all" ? "All types" : type === "stayops" ? "StayOps" : "Sponsors"}
                </option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | PipelineStatus)}>
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{formatStatusLabel(status)}</option>
              ))}
            </Select>
            <Select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
              <option value="all">All cities</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </Select>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value as (typeof SORT_OPTIONS)[number])}>
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "newest" ? "Sort: newest" : "Sort: highest value"}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/10 bg-black/35 p-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">StayOps Applications</div>
        <div className="mt-5 grid gap-3">
          {visibleStayOps.length ? (
            visibleStayOps.map((row) => (
              <ListRow key={row.id} row={row} onStatusChange={handleStatusChange} updating={updatingId === row.id} />
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/58">
              No StayOps applications yet.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[30px] border border-white/10 bg-black/35 p-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Sponsor Applications</div>
        <div className="mt-5 grid gap-3">
          {visibleSponsors.length ? (
            visibleSponsors.map((row) => (
              <ListRow key={row.id} row={row} onStatusChange={handleStatusChange} updating={updatingId === row.id} />
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/58">
              No sponsor applications yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
