type HapioStatus = {
  bookingUrl: string | null;
  hasToken: boolean;
  hasApiBaseUrl: boolean;
};

export function getHapioStatus(): HapioStatus {
  const bookingUrl = process.env.NEXT_PUBLIC_HAPIO_BOOKING_URL?.trim() || null;
  const token = process.env.HAPIO_API_TOKEN?.trim();
  const apiBaseUrl = process.env.HAPIO_API_BASE_URL?.trim();

  return {
    bookingUrl,
    hasToken: Boolean(token),
    hasApiBaseUrl: Boolean(token && apiBaseUrl),
  };
}

export async function fetchHapioAvailability() {
  const token = process.env.HAPIO_API_TOKEN?.trim();
  const apiBaseUrl = process.env.HAPIO_API_BASE_URL?.trim();

  if (!token || !apiBaseUrl) {
    return null;
  }

  try {
    const response = await fetch(apiBaseUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as unknown;
    return data;
  } catch {
    return null;
  }
}
