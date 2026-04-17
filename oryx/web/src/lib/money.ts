const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function roundUsd(value: number | string | null | undefined) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export function formatUsd(value: number | string | null | undefined) {
  return USD_FORMATTER.format(roundUsd(value));
}

export function fromStripeCents(value: number | string | null | undefined) {
  return roundUsd(Number(value || 0) / 100);
}

export function toStripeCents(value: number | string | null | undefined) {
  return Math.round(roundUsd(value) * 100);
}
