export type TicketWindowInput = {
  quantity_total: number | null;
  quantity_sold: number | null;
  sales_start_at?: string | null;
  sales_end_at?: string | null;
  is_active?: boolean | null;
  visibility_mode?: "visible" | "hidden" | null;
};

export type TicketAvailabilityState =
  | "active"
  | "scheduled"
  | "hidden"
  | "sold_out"
  | "ended";

export function getTicketAvailabilityState(ticket: TicketWindowInput, nowInput = new Date()) {
  const now = nowInput instanceof Date ? nowInput : new Date(nowInput);
  const total = Math.max(0, ticket.quantity_total || 0);
  const sold = Math.max(0, ticket.quantity_sold || 0);
  const remaining = Math.max(0, total - sold);
  const startsAt = ticket.sales_start_at ? new Date(ticket.sales_start_at) : null;
  const endsAt = ticket.sales_end_at ? new Date(ticket.sales_end_at) : null;
  const visible = (ticket.visibility_mode || "visible") === "visible";
  const activeToggle = Boolean(ticket.is_active);

  if (!visible) return "hidden";
  if (endsAt && endsAt.getTime() < now.getTime()) return "ended";
  if (remaining <= 0) return "sold_out";
  if (!activeToggle) return "hidden";
  if (startsAt && startsAt.getTime() > now.getTime()) return "scheduled";
  return "active";
}

export function canPurchaseTicketType(ticket: TicketWindowInput, nowInput = new Date()) {
  return getTicketAvailabilityState(ticket, nowInput) === "active";
}

export function getTicketAvailabilityLabel(state: TicketAvailabilityState) {
  switch (state) {
    case "active":
      return "On sale";
    case "scheduled":
      return "Upcoming";
    case "hidden":
      return "Hidden";
    case "sold_out":
      return "Sold out";
    case "ended":
      return "Ended";
  }
}
