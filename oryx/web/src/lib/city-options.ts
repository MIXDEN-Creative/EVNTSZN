import { PUBLIC_CITIES } from "@/lib/public-cities";

export const INTERNAL_CITY_OPTIONS = PUBLIC_CITIES.map((city) => city.name);

const STATE_ABBREVIATIONS: Record<string, string> = {
  Maryland: "MD",
  "District of Columbia": "DC",
  Delaware: "DE",
};

export function getCityStateLabel(cityName: string | null | undefined) {
  const match = PUBLIC_CITIES.find((city) => city.name.toLowerCase() === String(cityName || "").trim().toLowerCase());
  return match?.stateLabel || null;
}

export function getCityStateCode(cityName: string | null | undefined) {
  const state = getCityStateLabel(cityName);
  return state ? STATE_ABBREVIATIONS[state] || null : null;
}
