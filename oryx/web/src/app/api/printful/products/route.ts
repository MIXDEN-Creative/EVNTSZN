import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

export async function GET() {
  try {
    const [printfulRes, catalogRes] = await Promise.all([
      fetch("https://api.printful.com/store/products", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
        },
        cache: "no-store",
      }),
      supabaseAdmin
        .from("merch_storefront_catalog")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

    const printfulData = await printfulRes.json();

    if (!printfulRes.ok) {
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

    return NextResponse.json({
      ok: true,
      products: curated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load products",
      },
      { status: 500 }
    );
  }
}
