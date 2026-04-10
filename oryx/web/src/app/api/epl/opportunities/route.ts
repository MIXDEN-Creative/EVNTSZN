import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";
import { buildCompensationLabel, buildPublicPositionSummary } from "@/lib/epl-staffing";

function unwrapOne<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] || null : value || null;
}

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const city = req.nextUrl.searchParams.get("city");
  const search = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();

  let query = supabase
    .schema("epl")
    .from("staff_positions")
    .select(`
      id,
      city,
      state,
      position_status,
      visibility,
      slots_needed,
      slots_filled,
      publicly_listed,
      starts_at,
      ends_at,
      volunteer_perks,
      pay_amount,
      pay_type,
      employment_status,
      staff_role_templates (
        id,
        title,
        department,
        role_type,
        summary,
        requirements,
        volunteer_perks,
        pay_amount,
        pay_type,
        employment_status
      ),
      seasons (id, name, slug),
      evntszn_events:event_id (id, title, slug, city)
    `)
    .neq("visibility", "internal_only")
    .eq("publicly_listed", true)
    .not("position_status", "in", '("closed","archived")')
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  if (city) query = query.ilike("city", `%${city}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const opportunities = (data || [])
    .map((row: any) => {
      const template = unwrapOne(row.staff_role_templates);
      const season = unwrapOne(row.seasons);
      const event = unwrapOne(row.evntszn_events);
      return {
        id: row.id,
        title: template?.title || "Open position",
        department: template?.department || null,
        opportunity_type: template?.role_type || "volunteer",
        summary: buildPublicPositionSummary({
          summary: template?.summary || null,
          notes: null,
          role_type: template?.role_type || null,
          city: row.city || null,
          season_name: season?.name || null,
          event_title: event?.title || null,
        }),
        description: template?.summary || null,
        requirements: template?.requirements || [],
        perks: row.volunteer_perks?.length ? row.volunteer_perks : template?.volunteer_perks || [],
        pay_label: buildCompensationLabel({
          role_type: template?.role_type || null,
          pay_amount: row.pay_amount ?? template?.pay_amount ?? null,
          pay_type: row.pay_type ?? template?.pay_type ?? null,
          employment_status: row.employment_status ?? template?.employment_status ?? null,
        }),
        pay_type: row.pay_type ?? template?.pay_type ?? null,
        pay_amount: row.pay_amount ?? template?.pay_amount ?? null,
        employment_status: row.employment_status ?? template?.employment_status ?? null,
        location_city: row.city || null,
        location_state: row.state || null,
        season_name: season?.name || null,
        event_title: event?.title || null,
        position_status: row.position_status,
        slots_needed: row.slots_needed,
        slots_filled: row.slots_filled,
        role_type: template?.role_type || "volunteer",
      };
    })
    .filter((row) => {
      if (!search) return true;
      return [
        row.title,
        row.summary,
        row.department,
        row.location_city,
        row.opportunity_type,
        row.season_name,
        row.event_title,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });

  return NextResponse.json({ opportunities });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const contentType = req.headers.get("content-type") || "";

  let body: Record<string, unknown> = {};
  let resumeStoragePath: string | null = null;
  let resumeOriginalFilename: string | null = null;
  let resumeMimeType: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    body = {
      seasonSlug: formData.get("seasonSlug"),
      opportunityId: formData.get("opportunityId"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      city: formData.get("city"),
      state: formData.get("state"),
      preferredRoles: JSON.parse(String(formData.get("preferredRoles") || "[]")),
      experienceSummary: formData.get("experienceSummary"),
      availabilitySummary: formData.get("availabilitySummary"),
      whyJoin: formData.get("whyJoin"),
      resumeUrl: formData.get("resumeUrl"),
      portfolioUrl: formData.get("portfolioUrl"),
    };

    const resumeFile = formData.get("resumeFile");
    if (resumeFile instanceof File && resumeFile.size > 0) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(resumeFile.type)) {
        return NextResponse.json({ error: "Resume upload must be PDF or Word format." }, { status: 400 });
      }

      const email = String(formData.get("email") || "").trim().toLowerCase();
      const safeBaseName = resumeFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      resumeStoragePath = `season-1/${email || "applicant"}/${Date.now()}-${safeBaseName}`;
      resumeOriginalFilename = resumeFile.name;
      resumeMimeType = resumeFile.type;

      const bytes = await resumeFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const { error: uploadError } = await supabase.storage
        .from("epl-staff-resumes")
        .upload(resumeStoragePath, buffer, {
          contentType: resumeFile.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json({ error: `Resume upload failed: ${uploadError.message}` }, { status: 500 });
      }
    }
  } else {
    body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  }

  const {
    seasonSlug,
    opportunityId,
    firstName,
    lastName,
    email,
    phone,
    city,
    state,
    preferredRoles,
    experienceSummary,
    availabilitySummary,
    whyJoin,
    resumeUrl,
    portfolioUrl,
  } = body;

  const { data: leagueRow, error: leagueError } = await supabase
    .schema("epl")
    .from("leagues")
    .select("id")
    .eq("slug", "epl")
    .single();

  if (leagueError) {
    return NextResponse.json({ error: leagueError.message }, { status: 500 });
  }

  let seasonId: string | null = null;

  if (seasonSlug) {
    const { data: seasonRow, error: seasonError } = await supabase
      .schema("epl")
      .from("seasons")
      .select("id")
      .eq("slug", seasonSlug)
      .maybeSingle();

    if (seasonError) {
      return NextResponse.json({ error: seasonError.message }, { status: 500 });
    }

    seasonId = seasonRow?.id || null;
  }

  let positionId: string | null = null;
  let roleTemplateId: string | null = null;
  const selectedPositionId = String(opportunityId || "").trim();
  if (selectedPositionId) {
    const { data: positionRow, error: positionError } = await supabase
      .schema("epl")
      .from("staff_positions")
      .select("id, role_template_id")
      .eq("id", selectedPositionId)
      .maybeSingle();

    if (positionError) {
      return NextResponse.json({ error: positionError.message }, { status: 500 });
    }

    positionId = positionRow?.id || null;
    roleTemplateId = positionRow?.role_template_id || null;
  }

  const { error } = await supabase
    .schema("epl")
    .from("staff_applications")
    .insert({
      league_id: leagueRow.id,
      season_id: seasonId,
      opportunity_id: null,
      position_id: positionId,
      role_template_id: roleTemplateId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      city: city || null,
      state: state || null,
      preferred_roles: preferredRoles || [],
      experience_summary: experienceSummary || null,
      availability_summary: availabilitySummary || null,
      why_join: whyJoin || null,
      resume_url: resumeUrl || null,
      portfolio_url: portfolioUrl || null,
      status: "submitted",
      source: "epl_public_opportunities",
      source_metadata: {
        positionId,
        roleTemplateId,
        resumeStoragePath,
        resumeOriginalFilename,
        resumeMimeType,
      },
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
