import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import ProductTrustGrid from "@/components/public/ProductTrustGrid";
import SystemActivityRail from "@/components/public/SystemActivityRail";
import { buildCollectionPageSchema, buildItemListSchema, buildPageMetadata } from "@/lib/seo";
import { getNodeTypeLabel } from "@/lib/nodes";
import { getWebOrigin } from "@/lib/domains";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "EVNTSZN Nodes | discovery points and real-world routing",
  description:
    "EVNTSZN Nodes are the tap and scan discovery layer connecting venues, areas, events, crew funnels, campaigns, and city operations.",
  path: "/nodes",
  origin: getWebOrigin(),
});

export default async function NodesIndexPage() {
  const { data: nodes, error } = await supabaseAdmin
    .from("evntszn_nodes")
    .select("id, slug, public_title, internal_name, city, state, node_type, placement_label")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(24);
  const safeNodes = error ? [] : nodes || [];

  return (
    <PublicPageFrame
      title="Live discovery points running across the EVNTSZN network."
      description="Nodes are the tap and scan entry points tied to events, venues, areas, crew funnels, campaigns, and city operations."
      heroImage="https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1800&q=80"
      structuredData={[
        buildCollectionPageSchema({
          name: "EVNTSZN Nodes",
          description: "Discovery points and routing nodes across the EVNTSZN network.",
          path: "/nodes",
        }),
        buildItemListSchema({
          name: "Active nodes",
          path: "/nodes",
          items: safeNodes.slice(0, 24).map((node) => ({
            name: node.public_title || node.internal_name,
            url: `/nodes/${node.slug}`,
          })),
        }),
      ]}
    >
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.22),transparent_35%),linear-gradient(180deg,#09090c_0%,#050507_100%)]" />
        <div className="relative mx-auto max-w-[1500px] px-4 py-14 md:px-6 lg:px-8 lg:py-18">
          <div className="ev-kicker">EVNTSZN Nodes</div>
          <h1 className="ev-title max-w-5xl">Live discovery points running across the EVNTSZN network.</h1>
          <p className="ev-subtitle max-w-3xl">
            Nodes are the tap and scan entry points tied to events, venues, areas, crew funnels, campaigns, and city operations.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/56">
            Built for venue teams, operators, and city lanes that need a real-world routing surface instead of a vague technical object.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/venue" className="ev-button-primary">
              Onboard a venue
            </Link>
            <Link href="/venue/pro-reserve" className="ev-button-secondary">
              See Venue Pro + Reserve
            </Link>
            <Link href="/tap-to-pour" className="ev-button-secondary">
              Tap to Pour
            </Link>
          </div>
        </div>
      </section>

      <SystemActivityRail cityLabel="Baltimore" audienceLabel="people" mode="compact" />

      <section className="mx-auto max-w-[1500px] px-4 py-10 md:px-6 lg:px-8 lg:py-14">
        {error ? (
          <div className="mb-6 rounded-[28px] border border-amber-400/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-50">
            Node data is temporarily unavailable, but the public lane stays live and the stack still routes into venue, reserve, and Tap to Pour.
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {safeNodes.map((node) => (
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
          {!safeNodes.length ? (
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#A259FF]">Node lane</div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Nodes are still available as a product lane.</h2>
              <p className="mt-3 text-sm leading-6 text-white/62">
                Even with limited live data, the route stays useful for venue routing, reserve conversion, and future discovery points.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/venue" className="ev-button-secondary">View Venue</Link>
                <Link href="/reserve" className="ev-button-primary">Open Reserve</Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-14 md:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Venue", "/venue", "Use Nodes to support venue visibility."],
            ["Reserve", "/reserve", "Move node traffic into booking intent."],
            ["Tap to Pour", "/tap-to-pour", "Add the hospitality interaction layer."],
            ["Venue Pro", "/venue/pro", "Upgrade the operating stack around the node."],
          ].map(([label, href, body]) => (
            <Link key={label} href={href} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">{label}</div>
              <p className="mt-3 text-sm leading-6 text-white/64">{body}</p>
            </Link>
          ))}
        </div>
      </section>

      <ProductTrustGrid
        title="Nodes make the ecosystem easier to understand in the real world."
        subtitle="They turn tap points, scan points, and discovery surfaces into a routing layer that venues and operators can actually use."
        proofTitle="Proof"
        proof={[
          { title: "Real routing", body: "Nodes connect into venues, events, crew funnels, and city operations." },
          { title: "Operational context", body: "The product is tied to actual destinations, not a vague technical system." },
          { title: "Public utility", body: "The page stays useful even when live node density is low." },
        ]}
        outcomesTitle="Outcomes"
        outcomes={[
          { title: "More visible", body: "The node becomes part of the discovery story instead of hidden infrastructure." },
          { title: "More actionable", body: "Guests and operators can use the node to move into a real destination." },
          { title: "More premium", body: "The stack feels like a composed operating layer instead of raw tooling." },
        ]}
        objectionsTitle="Objections"
        objections={[
          { question: "Is this only for technical teams?", answer: "No. It is a public-facing routing layer for venues and city operations." },
          { question: "What if we do not have many nodes yet?", answer: "The page still works and points into venue, reserve, and Tap to Pour." },
          { question: "Why not just use links?", answer: "Nodes add context, route behavior, and measurable operational value." },
        ]}
        links={[
          { href: "/venue", label: "Back to Venue" },
          { href: "/reserve", label: "Open Reserve" },
          { href: "/tap-to-pour", label: "Tap to Pour" },
        ]}
      />
    </PublicPageFrame>
  );
}
