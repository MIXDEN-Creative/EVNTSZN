import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      slug?: string;
      name?: string;
      email?: string;
    };

    const slug = String(body.slug || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();

    if (!slug || !email) {
      return NextResponse.json({ error: "Slug and email are required." }, { status: 400 });
    }

    const { data: page, error: pageError } = await supabaseAdmin
      .from("evntszn_link_pages")
      .select("id, email_capture_enabled")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (pageError) {
      return NextResponse.json({ error: pageError.message }, { status: 500 });
    }

    if (!page || page.email_capture_enabled === false) {
      return NextResponse.json({ error: "This page is not accepting leads." }, { status: 404 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabaseAdmin.from("evntszn_link_leads").insert({
      link_page_id: page.id,
      captured_by_user_id: user?.id || null,
      name: name || null,
      email,
      source: "public_link",
      metadata: {
        userAgent: request.headers.get("user-agent"),
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not capture lead." },
      { status: 500 },
    );
  }
}
