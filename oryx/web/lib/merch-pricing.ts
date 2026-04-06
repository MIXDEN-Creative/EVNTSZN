export function getMarkupForProduct(productName: string): number {
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

export function getSellPrice(baseAmount: number, productName: string): number {
  return baseAmount + getMarkupForProduct(productName);
}
