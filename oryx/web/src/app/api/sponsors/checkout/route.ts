import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getWebOrigin } from "@/lib/domains";
import { logSystemIssue } from "@/lib/system-logs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const packageId = String(body.packageId || "").trim();
  const companyName = String(body.companyName || "").trim();
  const contactEmail = String(body.contactEmail || "").trim().toLowerCase();
  const contactName = String(body.contactName || "").trim() || null;
  const contactPhone = String(body.contactPhone || "").trim() || null;

  if (!packageId || !companyName || !contactEmail) {
    return NextResponse.json({ error: "Package, company, and contact email are required." }, { status: 400 });
  }

  const { data: sponsorPackage, error: packageError } = await supabaseAdmin
    .schema("epl")
    .from("sponsorship_packages")
    .select("id, package_name, description, cash_price_cents, is_active")
    .eq("id", packageId)
    .single();

  if (packageError || !sponsorPackage || !sponsorPackage.is_active) {
    return NextResponse.json({ error: packageError?.message || "Package is unavailable." }, { status: 404 });
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("evntszn_sponsor_package_orders")
    .insert({
      package_id: sponsorPackage.id,
      package_name: sponsorPackage.package_name,
      company_name: companyName,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      order_type: "purchase",
      status: "pending",
      amount_cents: sponsorPackage.cash_price_cents,
      metadata: {
        description: sponsorPackage.description,
      },
    })
    .select("id")
    .single();

  if (orderError || !order) {
    await logSystemIssue({
      source: "sponsors.checkout",
      code: "order_create_failed",
      message: orderError?.message || "Could not create sponsor package order.",
      context: { packageId, companyName, contactEmail },
    });
    return NextResponse.json({ error: orderError?.message || "Could not create order." }, { status: 500 });
  }

  const baseUrl = getWebOrigin(new URL(request.url).host);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    billing_address_collection: "required",
    customer_email: contactEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: sponsorPackage.cash_price_cents,
          product_data: {
            name: sponsorPackage.package_name,
            description: sponsorPackage.description || undefined,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      checkout_kind: "sponsor_package",
      sponsor_package_order_id: order.id,
      sponsor_package_id: sponsorPackage.id,
      sponsor_company_name: companyName,
      sponsor_contact_name: contactName || "",
      sponsor_contact_email: contactEmail,
    },
    success_url: `${baseUrl}/partners/packages?status=success`,
    cancel_url: `${baseUrl}/partners/packages?status=canceled`,
  });

  await supabaseAdmin
    .from("evntszn_sponsor_package_orders")
    .update({
      stripe_checkout_session_id: session.id,
    })
    .eq("id", order.id);

  return NextResponse.json({ url: session.url });
}
