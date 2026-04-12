import { requireAdminPermission } from "@/lib/admin-auth";
import EventsAdminClient from "./EventsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  await requireAdminPermission("events.manage", "/epl/admin/events");
  return <EventsAdminClient initialEvents={[]} offices={[]} />;
}
