const DEFAULT_ORIGIN = "https://mixdencreative.com";

export function getSiteOrigin() {
  const value = process.env.NEXT_PUBLIC_MIXDEN_CREATIVE_ORIGIN?.trim();

  if (!value) {
    return new URL(DEFAULT_ORIGIN);
  }

  try {
    return new URL(value);
  } catch {
    return new URL(DEFAULT_ORIGIN);
  }
}
