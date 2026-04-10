import { NextResponse } from "next/server";
import { requireAdmin, getAdminPermissions } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type AssigneeSummary = {
  user_id: string;
  full_name: string;
  city: string | null;
  roles: string[];
};

export async function GET() {
  const { user } = await requireAdmin("/epl/admin/support");
  const permissions = await getAdminPermissions(user.id);

  if (!permissions.includes("support.manage") && !permissions.includes("support.respond")) {
    return NextResponse.json({ error: "Support access is not enabled for this account." }, { status: 403 });
  }

  const [ticketsRes, assigneesRes, profilesRes, eventsRes, updatesRes] = await Promise.all([
    supabaseAdmin
      .from("support_tickets")
      .select(`
        id,
        ticket_code,
        name,
        email,
        role_label,
        issue_type,
        issue_subtype,
        source_surface,
        page_path,
        page_url,
        related_order_code,
        occurred_on,
        occurred_at_label,
        linked_city,
        linked_office_label,
        severity,
        status,
        description,
        resolution_notes,
        metadata,
        assignee_user_id,
        created_at,
        updated_at,
        resolved_at,
        evntszn_events:related_event_id (
          id,
          title,
          slug,
          city
        )
      `)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("user_roles")
      .select("user_id, roles(name)")
      .eq("is_active", true),
    supabaseAdmin.from("evntszn_profiles").select("user_id, full_name, city"),
    supabaseAdmin
      .from("evntszn_events")
      .select("id, title, city, slug")
      .order("start_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("support_ticket_updates")
      .select("id, ticket_id, update_type, status_to, assignee_user_id, note_body, created_at, author_user_id")
      .order("created_at", { ascending: true }),
  ]);

  if (ticketsRes.error || assigneesRes.error || profilesRes.error || eventsRes.error || updatesRes.error) {
    return NextResponse.json(
      { error: ticketsRes.error?.message || assigneesRes.error?.message || profilesRes.error?.message || eventsRes.error?.message || updatesRes.error?.message },
      { status: 500 },
    );
  }

  const profileMap = new Map((profilesRes.data || []).map((profile) => [profile.user_id, profile]));
  const assigneeMap = new Map<string, AssigneeSummary>();
  for (const row of assigneesRes.data || []) {
    const profile = profileMap.get(row.user_id);
    const current: AssigneeSummary = assigneeMap.get(row.user_id) || {
      user_id: row.user_id,
      full_name: profile?.full_name || row.user_id,
      city: profile?.city || null,
      roles: [],
    };
    const roleName = Array.isArray(row.roles) ? row.roles[0]?.name : (row.roles as { name?: string } | null)?.name;
    if (roleName && !current.roles.includes(roleName)) current.roles.push(roleName);
    assigneeMap.set(row.user_id, current);
  }

  const updates = (updatesRes.data || []).map((update) => ({
    ...update,
    author_name: profileMap.get(update.author_user_id)?.full_name || update.author_user_id || "System",
    assignee_name: update.assignee_user_id ? profileMap.get(update.assignee_user_id)?.full_name || update.assignee_user_id : null,
  }));

  return NextResponse.json({
    tickets: ticketsRes.data || [],
    updates,
    assignees: Array.from(assigneeMap.values()).sort((a, b) => a.full_name.localeCompare(b.full_name)),
    events: eventsRes.data || [],
    canAssign: permissions.includes("support.assign") || permissions.includes("support.manage"),
    canManage: permissions.includes("support.manage"),
  });
}
