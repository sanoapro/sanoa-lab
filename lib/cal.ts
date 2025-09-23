// /lib/cal.ts
export type CalBooking = {
  uid: string;
  title?: string;
  start: string;
  end: string;
  meetingUrl?: string | null;
  hosts?: any[];
  attendees?: { email?: string }[];
  eventTypeSlug?: string | null;
};

export type FetchBookingsParams = {
  status?: "upcoming" | "past" | "accepted";
  q?: string;
  afterStart?: string; // ISO
  beforeEnd?: string;  // ISO
  take?: number;
};

// Usa el fetch seguro
import { fetchJSON } from "@/lib/utils";

/** Proxy a nuestro endpoint interno: /api/cal/bookings */
export async function fetchBookings(params: FetchBookingsParams = {}): Promise<CalBooking[]> {
  const usp = new URLSearchParams();
  if (params.status) usp.set("status", params.status);
  if (params.q) usp.set("q", params.q);
  if (params.afterStart) usp.set("afterStart", params.afterStart);
  if (params.beforeEnd) usp.set("beforeEnd", params.beforeEnd);
  if (params.take) usp.set("take", String(params.take));

  // Este endpoint debe devolver { items: CalBooking[] } o { error }
  const data = await fetchJSON<{ items: CalBooking[]; error?: string }>(
    `/api/cal/bookings?${usp.toString()}`
  );
  return data.items || [];
}
