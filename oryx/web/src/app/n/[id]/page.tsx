import { notFound } from "next/navigation";
import NodeActionState from "@/components/evntszn/NodeActionState";
import { getNodeActionSnapshot } from "@/lib/evntszn-phase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function mapNodeEntityType(locationType: string | null | undefined) {
  if (locationType === "venue") return "venue";
  if (locationType === "curator_destination") return "link";
  if (locationType === "epl_location") return "epl_city";
  return "node";
}

export default async function NodeHandlerPage({ params }: RouteContext) {
  const { id } = await params;
  const snapshot = await getNodeActionSnapshot(id);
  if (!snapshot) notFound();

  return (
    <main className="ev-public-page">
      <NodeActionState
        nodeSlug={snapshot.node.slug || id}
        nodeKey={id}
        city={snapshot.node.city || null}
        areaLabel={snapshot.node.area_label || null}
        title={snapshot.title}
        actionLine={snapshot.actionLine}
        destinationHref={snapshot.destination.href}
        destinationLabel={snapshot.destination.label === "Reserve venue" ? "Reserve nearby" : snapshot.destination.label}
        entityType={mapNodeEntityType(snapshot.node.location_type)}
        entityKey={snapshot.node.slug || id}
      />
    </main>
  );
}
