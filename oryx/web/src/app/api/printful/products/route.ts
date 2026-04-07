import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logSystemIssue } from "@/lib/system-logs";

type PrintfulStoreProduct = {
  id: number;
  name: string;
  thumbnail_url?: string | null;
};

type CatalogRow = {
  printful_product_id: number;
  title_override?: string | null;
  category?: string | null;
  badge?: string | null;
  is_featured?: boolean | null;
  subtitle?: string | null;
  sort_order?: number | null;
};

type PrintfulProductsResponse = {
  error?: {
    message?: string | null;
  } | null;
  result?: PrintfulStoreProduct[] | null;
};

export async function GET() {
  try {
    const apiKey = process.env.PRINTFUL_API_KEY;
    if (!apiKey) {
      await logSystemIssue({
        source: "printful.products",
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

    const [printfulRes, catalogRes] = await Promise.all([
      fetch("https://api.printful.com/store/products", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        cache: "no-store",
      }),
      supabaseAdmin
        .from("merch_storefront_catalog")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

    const printfulData = (await printfulRes.json()) as PrintfulProductsResponse;

    if (!printfulRes.ok) {
      await logSystemIssue({
        source: "printful.products",
        severity: "error",
        code: "printful_fetch_failed",
        message: printfulData?.error?.message || "Failed to load Printful products",
      });
      return NextResponse.json(
        {
          ok: false,
          error: printfulData?.error?.message || "Failed to load Printful products",
        },
        { status: 500 }
      );
    }

    const catalogRows = (catalogRes.data || []) as CatalogRow[];
    const products = (printfulData?.result || []) as PrintfulStoreProduct[];
    const byId = new Map<number, PrintfulStoreProduct>(
      products.map((product) => [product.id, product])
    );

    const curated = catalogRows
      .map((row) => {
        const p = byId.get(row.printful_product_id);
        if (!p) return null;

        return {
          id: p.id,
          name: row.title_override || p.name,
          thumbnail_url: p.thumbnail_url,
          category: row.category,
          badge: row.badge,
          is_featured: row.is_featured,
          subtitle: row.subtitle || "",
          sort_order: row.sort_order,
        };
      })
      .filter(Boolean);

    const fallbackProducts = products.map((product, index) => ({
      id: product.id,
      name: product.name,
      thumbnail_url: product.thumbnail_url,
      category: "EPL Merch",
      badge: null,
      is_featured: index < 6,
      subtitle: "Official Printful-backed product",
      sort_order: index,
    }));

    const catalogErrorMessage = catalogRes.error?.message || "";
    const missingCatalogTable =
      Boolean(catalogRes.error) &&
      /merch_storefront_catalog|schema cache|relation/i.test(String(catalogErrorMessage));

    const finalProducts =
      curated.length > 0
        ? curated
        : fallbackProducts;

    return NextResponse.json({
      ok: true,
      catalogReady: !missingCatalogTable,
      products: finalProducts,
    });
  } catch (error) {
    await logSystemIssue({
      source: "printful.products",
      severity: "error",
      code: "unexpected_failure",
      message: error instanceof Error ? error.message : "Failed to load products",
    });
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load products",
      },
      { status: 500 }
    );
  }
}
