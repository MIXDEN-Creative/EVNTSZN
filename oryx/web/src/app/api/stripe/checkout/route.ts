import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/domains";

function getMarkupForProduct(productName: string): number {
  const name = productName.toLowerCase();
  if (name.includes("hoodie")) return 1200;
  if (name.includes("sweatpants")) return 1200;
  if (name.includes("leggings")) return 1000;
  if (name.includes("backpack")) return 1200;
  if (name.includes("gym bag")) return 1000;
  if (name.includes("water bottle")) return 800;
  if (name.includes("snapback")) return 900;
  if (name.includes("dad hat")) return 800;
  if (name.includes("headband")) return 600;
  if (name.includes("bandana")) return 500;
  if (name.includes("tote bag")) return 700;
  if (name.includes("fanny pack")) return 900;
  if (name.includes("tee")) return 800;
  if (name.includes("tank")) return 800;
  if (name.includes("hand towel")) return 600;
  return 800;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const {
      productName,
      image,
      amount,
      baseAmount,
      quantity,
      printfulVariantId,
      printfulProductId,
    } = body as {
      productName: string;
      image?: string;
      amount: number;
      baseAmount?: number;
      quantity: number;
      printfulVariantId: number | string;
      printfulProductId?: number | null;
    };

    if (!productName || !amount || !quantity || !printfulVariantId) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const markupAmount =
      typeof baseAmount === "number"
        ? amount - baseAmount
        : getMarkupForProduct(productName);

    const computedBaseAmount =
      typeof baseAmount === "number" ? baseAmount : amount - markupAmount;

    const requestHost = new URL(request.url).host;
    const baseUrl = getAppOrigin(requestHost);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              images: image ? [image] : [],
            },
            unit_amount: amount,
          },
          quantity,
        },
      ],
      metadata: {
        productName,
        printfulVariantId: String(printfulVariantId),
        printfulProductId: printfulProductId ? String(printfulProductId) : "",
        quantity: String(quantity),
        markupAmount: String(markupAmount),
        baseAmount: String(computedBaseAmount),
        userId: user?.id || "",
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout creation failed" },
      { status: 500 }
    );
  }
}
