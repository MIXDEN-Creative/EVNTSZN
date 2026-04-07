import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const city = req.nextUrl.searchParams.get("city");
  const search = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();

  let query = supabase
    .from("epl_v_public_opportunities")
    .select("*")
    .order("priority_score", { ascending: true })
    .order("display_order", { ascending: true });

  if (city) query = query.ilike("location_city", `%${city}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const opportunities = (data || []).filter((row: any) => {
    if (!search) return true;
    return [
      row.title,
      row.summary,
      row.department,
      row.location_city,
      row.opportunity_type,
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

  const { error } = await supabase
    .schema("epl")
    .from("staff_applications")
    .insert({
      league_id: leagueRow.id,
      season_id: seasonId,
      opportunity_id: opportunityId || null,
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
        opportunityId: opportunityId || null,
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
