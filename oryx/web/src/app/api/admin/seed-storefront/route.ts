import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthorized } from "@/lib/admin-auth";

export async function POST() {
  const allowed = await isAdminAuthorized();
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const seed = [
    { printful_product_id: 426281384, category: "Essentials", badge: "Core", sort_order: 1, is_featured: true, is_active: true },
    { printful_product_id: 426280520, category: "Essentials", badge: "Core", sort_order: 2, is_featured: true, is_active: true },
    { printful_product_id: 426282029, category: "Essentials", badge: "Performance", sort_order: 3, is_featured: true, is_active: true },
    { printful_product_id: 426285170, category: "Accessories", badge: "Classic", sort_order: 4, is_featured: true, is_active: true },
    { printful_product_id: 426287019, category: "Accessories", badge: "Premium", sort_order: 5, is_featured: true, is_active: true },
    { printful_product_id: 426288451, category: "Accessories", badge: "Lifestyle", sort_order: 6, is_featured: false, is_active: true },
    { printful_product_id: 426286388, category: "Lifestyle", badge: "Carry", sort_order: 7, is_featured: false, is_active: true },
    { printful_product_id: 426294563, category: "Lifestyle", badge: "Travel", sort_order: 8, is_featured: false, is_active: true }
  ];

  const { error } = await supabaseAdmin
    .from("merch_storefront_catalog")
    .upsert(seed, { onConflict: "printful_product_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, seeded: seed.length });
}
