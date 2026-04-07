import { NextResponse } from "next/server";
import { logSystemIssue } from "@/lib/system-logs";

type Params = Promise<{ id: string }>;
type PrintfulVariant = {
  id: number;
  variant_id?: number | null;
  retail_price?: string | null;
  name?: string | null;
  sku?: string | null;
};

type PrintfulProductDetailResponse = {
  result?: {
    sync_product?: Record<string, unknown> | null;
    sync_variants?: PrintfulVariant[] | null;
  } | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  try {
    const apiKey = process.env.PRINTFUL_API_KEY;
    if (!apiKey) {
      await logSystemIssue({
        source: "printful.product-detail",
        severity: "warning",
        code: "missing_api_key",
        message: "PRINTFUL_API_KEY is not configured.",
      });
      return NextResponse.json(
        {
          ok: false,
          error: "PRINTFUL_API_KEY is not configured.",
        },
        { status: 503 }
      );
    }

    const { id } = await params;

    const res = await fetch(`https://api.printful.com/store/products/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    const data = (await res.json()) as PrintfulProductDetailResponse;

    if (!res.ok) {
      await logSystemIssue({
        source: "printful.product-detail",
        severity: "error",
        code: "product_detail_failed",
        message: "Failed to load product details from Printful.",
        context: { id },
      });
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to load product details from Printful.",
          status: res.status,
        },
        { status: 500 }
      );
    }

    const rawVariants = (data?.result?.sync_variants ?? []) as PrintfulVariant[];

    const variants = rawVariants.map((variant) => ({
      id: variant.id,
      sync_variant_id: variant.id,
      catalog_variant_id: variant.variant_id ?? null,
      retail_price: variant.retail_price,
      name: variant.name,
      sku: variant.sku ?? null,
    }));

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      product: data?.result?.sync_product ?? null,
      variants,
    });
  } catch (error) {
    await logSystemIssue({
      source: "printful.product-detail",
      severity: "error",
      code: "unexpected_failure",
      message: error instanceof Error ? error.message : "Failed to load product",
    });
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load product",
      },
      { status: 500 }
    );
  }
}
