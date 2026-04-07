"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  thumbnail_url?: string;
  category?: string;
  badge?: string;
  subtitle?: string;
  is_featured?: boolean;
};

type Variant = {
  id: number;
  sync_variant_id: number;
  catalog_variant_id?: number | null;
  retail_price?: string;
  name?: string;
  sku?: string | null;
};

function getMarkup(productName: string): number {
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

export default function EPLStorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedSyncVariantId, setSelectedSyncVariantId] = useState<number | null>(null);
  const [selectedVariantPrice, setSelectedVariantPrice] = useState<number>(0);
  const [selectedBaseAmount, setSelectedBaseAmount] = useState<number>(0);
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [productsError, setProductsError] = useState("");
  const [variantsError, setVariantsError] = useState("");
  const [catalogReady, setCatalogReady] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductsError("");

    try {
      const res = await fetch("/api/printful/products", {
        cache: "no-store",
      });

      const data = (await res.json()) as Record<string, any>;

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load products");
      }

      setProducts(data.products || []);
      setCatalogReady(data.catalogReady !== false);
    } catch (error) {
      console.error("STORE PRODUCTS LOAD ERROR:", error);
      setProducts([]);
      setCatalogReady(false);
      setProductsError(
        error instanceof Error ? error.message : "Failed to load products"
      );
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(
        products
          .map((p) => p.category)
          .filter(Boolean) as string[]
      )
    );
    return ["All", ...cats];
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (selectedCategory === "All") return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  async function loadVariants(productId: number, productName: string, image?: string) {
    setSelectedProductId(productId);
    setSelectedProductName(productName);
    setSelectedImage(image || "");
    setSelectedVariantId(null);
    setSelectedSyncVariantId(null);
    setVariants([]);
    setSelectedVariantPrice(0);
    setSelectedBaseAmount(0);
    setLoadingVariants(true);
    setVariantsError("");

    try {
      const res = await fetch(`/api/printful/products/${productId}`, {
        cache: "no-store",
      });

      const data = (await res.json()) as Record<string, any>;

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load product details");
      }

      const nextVariants = data.variants || [];
      setVariants(nextVariants);

      if (nextVariants.length > 0) {
        const firstVariant = nextVariants[0];
        const basePrice = Math.round(Number(firstVariant.retail_price || "35") * 100);
        const markup = getMarkup(productName);

        setSelectedVariantId(firstVariant.id);
        setSelectedSyncVariantId(firstVariant.sync_variant_id);
        setSelectedBaseAmount(basePrice);
        setSelectedVariantPrice(basePrice + markup);
      }
    } catch (error) {
      console.error("STORE VARIANTS LOAD ERROR:", error);
      setVariants([]);
      setVariantsError(
        error instanceof Error ? error.message : "Could not load product details"
      );
    } finally {
      setLoadingVariants(false);
    }
  }

  function onVariantChange(value: string) {
    const id = Number(value);
    setSelectedVariantId(id);

    const found = variants.find((variant) => variant.id === id);
    const basePrice = Math.round(Number(found?.retail_price || "35") * 100);
    const markup = getMarkup(selectedProductName);

    setSelectedSyncVariantId(found?.sync_variant_id ?? null);
    setSelectedBaseAmount(basePrice);
    setSelectedVariantPrice(basePrice + markup);
  }

  async function handleCheckout() {
    if (!selectedSyncVariantId || !selectedProductName || !selectedProductId) return;

    setCheckoutLoading(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName: selectedProductName,
          image: selectedImage,
          amount: selectedVariantPrice,
          baseAmount: selectedBaseAmount,
          quantity: 1,
          printfulVariantId: selectedSyncVariantId,
          printfulProductId: selectedProductId,
        }),
      });

      const data = (await res.json()) as Record<string, any>;

      if (!res.ok) {
        throw new Error(data?.error || "Checkout failed");
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Checkout URL was not returned");
    } catch (error) {
      console.error("STORE CHECKOUT ERROR:", error);
      alert(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="border-b border-white/10 bg-gradient-to-b from-[#0a0a0a] to-black">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="inline-flex items-center rounded-full border border-[#A259FF]/40 bg-[#A259FF]/10 px-4 py-1 text-sm text-[#d8c2ff]">
            EVNTSZN PRIME LEAGUE
          </div>

          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            EPL Store
          </h1>

          <p className="mt-3 max-w-2xl text-lg text-white/70">
            Official EVNTSZN Prime League merch.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        {!catalogReady ? (
          <div className="mb-6 rounded-2xl border border-[#A259FF]/25 bg-[#A259FF]/10 px-4 py-3 text-sm text-[#e1d0ff]">
            Catalog controls are still syncing, so the store is showing live Printful inventory directly.
          </div>
        ) : null}

        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === category
                    ? "bg-[#A259FF] text-white"
                    : "border border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/10"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <button
            onClick={loadProducts}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
          >
            Refresh Products
          </button>
        </div>

        <div className={`grid gap-8 ${selectedProductId ? "lg:grid-cols-[1.5fr_.9fr]" : "lg:grid-cols-1"}`}>
          <div>
            <h2 className="mb-4 text-xl font-semibold">Shop Merch</h2>

            {loadingProducts ? (
              <div className="text-white/60">Loading products...</div>
            ) : productsError ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
                <div>{productsError}</div>
                <button
                  onClick={loadProducts}
                  className="mt-3 rounded-xl border border-red-400/30 px-4 py-2 text-sm hover:bg-red-500/10"
                >
                  Try Again
                </button>
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-white/60">
                No products are live in this category yet. Refresh the store or switch collections to check the latest Printful inventory.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visibleProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() =>
                      loadVariants(product.id, product.name, product.thumbnail_url)
                    }
                    className={`group rounded-2xl border text-left transition ${
                      selectedProductId === product.id
                        ? "border-[#A259FF] bg-white/[0.04] shadow-[0_0_0_1px_rgba(162,89,255,.35)]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="h-64 overflow-hidden rounded-t-2xl bg-white p-4 flex items-center justify-center">
                      {product.thumbnail_url ? (
                        <img
                          src={product.thumbnail_url}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-black/45">
                          Product art is being prepared.
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A259FF]">
                          {product.category || "EPL Merch"}
                        </div>
                        {product.badge ? (
                          <div className="inline-flex shrink-0 whitespace-nowrap rounded-full border border-[#A259FF]/30 bg-[#A259FF]/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[#d8c2ff]">
                            {product.badge}
                          </div>
                        ) : null}
                      </div>

                      <h3 className="mt-3 min-h-[56px] text-base font-semibold leading-tight">
                        {product.name}
                      </h3>

                      <p className="mt-2 text-sm text-white/55">
                        {product.subtitle || "Tap to view variants"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedProductId ? (
            <aside className="sticky top-6 h-fit rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A259FF]">
                Product Panel
              </div>

              {loadingVariants ? (
                <div className="mt-6 text-white/60">Loading product details...</div>
              ) : variantsError ? (
                <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
                  {variantsError}
                </div>
              ) : (
                <>
                  <div className="mt-5 h-80 overflow-hidden rounded-2xl border border-white/10 bg-white p-4 flex items-center justify-center">
                    {selectedImage ? (
                      <img
                        src={selectedImage}
                        alt={selectedProductName}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : null}
                  </div>

                  <h3 className="mt-5 text-2xl font-bold leading-tight">
                    {selectedProductName}
                  </h3>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm text-white/70">
                      Choose variant
                    </label>

                    <select
                      value={selectedVariantId ?? ""}
                      onChange={(e) => onVariantChange(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-black px-4 py-3 text-white outline-none"
                    >
                      {variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.name || `Variant ${variant.id}`}
                          {variant.retail_price ? ` - $${variant.retail_price}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
                    <div className="text-sm text-white/55">Price</div>
                    <div className="mt-1 text-3xl font-black">
                      ${selectedVariantPrice ? (selectedVariantPrice / 100).toFixed(2) : "--"}
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={!selectedSyncVariantId || checkoutLoading}
                    className="mt-5 w-full rounded-2xl bg-[#A259FF] px-5 py-4 text-base font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checkoutLoading ? "Redirecting..." : "Buy Now"}
                  </button>
                </>
              )}
            </aside>
          ) : null}
        </div>
      </section>
    </main>
  );
}
