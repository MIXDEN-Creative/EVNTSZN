import { calculateCrewMarketplaceFee } from "@/lib/evntszn-monetization";
import { toStripeCents } from "@/lib/money";

export type ZoneState = "hot" | "rising" | "active" | "low";

export type ReserveVenueSummary = {
  id: string;
  reserveVenueId: string | null;
  slug: string;
  name: string;
  city: string;
  state: string;
  reservationFeeUsd: number;
  maxPartySize: number;
  waitlistEnabled: boolean;
  urgency: string;
  slots: string[];
};

export type CrewMemberSummary = {
  id: string;
  slug: string;
  name: string;
  category: string;
  city: string;
  state: string;
  priceFromUsd: number;
  headline: string;
  partnerTier: "standard" | "partner" | "pro_partner";
};

export type VenueSupplySummary = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  capacity?: number | null;
  planKey?: string | null;
  monthlyPriceUsd?: number;
  reserveMonthlyPriceUsd?: number;
  reserveEnabled?: boolean;
  smartFillEnabled: boolean;
  smartFillPriceNote: string | null;
  linkSlug: string | null;
};

export function calculateCrewBookingFee(input: {
  subtotalUsd: number;
  category: string;
  partnerTier?: "standard" | "partner" | "pro_partner";
}) {
  return calculateCrewMarketplaceFee(input);
}

export function buildReservationCheckoutPayload(input: {
  venue: ReserveVenueSummary;
  date: string;
  time: string;
  partySize: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  waitlist: boolean;
}) {
  return {
    venueSlug: input.venue.slug,
    reserveVenueId: input.venue.reserveVenueId,
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    guestPhone: input.guestPhone || "",
    bookingDate: input.date,
    bookingTime: input.time,
    partySize: input.partySize,
    waitlist: input.waitlist,
    amountUsd: input.venue.reservationFeeUsd,
    amountCents: toStripeCents(input.venue.reservationFeeUsd),
  };
}
