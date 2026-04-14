import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getNodeTypeLabel } from "@/lib/nodes";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function NodesIndexPage() {
  const { data: nodes, error } = await supabaseAdmin
    .from("evntszn_nodes")
    .select("id, slug, public_title, internal_name, city, state, node_type, placement_label")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(24);

  if (error) {
    throw new Error(error.message);
  }

  return (
    <PublicPageFrame>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.22),transparent_35%),linear-gradient(180deg,#09090c_0%,#050507_100%)]" />
        <div className="relative mx-auto max-w-[1500px] px-4 py-14 md:px-6 lg:px-8 lg:py-18">
          <div className="ev-kicker">EVNTSZN Nodes</div>
          <h1 className="ev-title max-w-5xl">Live discovery points running across the EVNTSZN network.</h1>
          <p className="ev-subtitle max-w-3xl">
            Nodes are the tap and scan entry points tied to events, venues, areas, crew funnels, campaigns, and city operations.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-10 md:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(nodes || []).map((node) => (
            <a key={node.id} href={`/nodes/${node.slug}`} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-[1px] hover:bg-white/[0.05]">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#A259FF]">{getNodeTypeLabel(node.node_type)}</div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">{node.public_title || node.internal_name}</h2>
              <p className="mt-3 text-sm leading-6 text-white/62">
                {node.placement_label || "Open the live node experience, see active signals, and route into the right EVNTSZN destination."}
              </p>
              <div className="mt-4 text-xs uppercase tracking-[0.18em] text-white/42">
                {[node.city, node.state].filter(Boolean).join(", ") || "EVNTSZN"}
              </div>
            </a>
          ))}
        </div>
      </section>
    </PublicPageFrame>
  );
}
