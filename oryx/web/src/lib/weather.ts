export type DiscoveryWeatherSnapshot = {
  summary: string;
  temperatureF: number | null;
  feelsLikeF: number | null;
  icon: string | null;
  venueNote: string | null;
};

type OpenWeatherResponse = {
  weather?: Array<{
    main?: string;
    description?: string;
    icon?: string;
  }>;
  main?: {
    temp?: number;
    feels_like?: number;
  };
};

function normalizeTemperature(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null;
}

export async function getDiscoveryWeather(input: {
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return null;
  }

  const baseUrl = (process.env.OPENWEATHER_API_URL || "https://api.openweathermap.org/data/2.5").replace(/\/$/, "");
  const params = new URLSearchParams({
    appid: apiKey,
    units: "imperial",
  });

  if (typeof input.latitude === "number" && typeof input.longitude === "number") {
    params.set("lat", String(input.latitude));
    params.set("lon", String(input.longitude));
  } else if (input.city?.trim()) {
    params.set("q", input.city.trim());
  } else {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}/weather?${params.toString()}`, {
      next: { revalidate: 900 },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as OpenWeatherResponse;
    const condition = payload.weather?.[0];
    const temp = normalizeTemperature(payload.main?.temp);
    const feelsLike = normalizeTemperature(payload.main?.feels_like);
    const conditionLabel = condition?.description || condition?.main || "Current conditions";

    return {
      summary: temp !== null ? `${conditionLabel} · ${temp}°F` : conditionLabel,
      temperatureF: temp,
      feelsLikeF: feelsLike,
      icon: condition?.icon || null,
      venueNote:
        temp !== null
          ? temp < 45
            ? "Layer up before you head out."
            : temp > 82
              ? "Plan for a warm night out."
              : "Easy conditions for a night out."
          : null,
    } satisfies DiscoveryWeatherSnapshot;
  } catch {
    return null;
  }
}
