export interface CalBooking {
  uid: string;
  title: string;
  status: string;
  start: string;
  end: string;
  meetingUrl: string | null;
  eventTypeId: number | null;
  eventTypeSlug: string | null;
  hosts: { name: string; email: string; username: string }[];
  attendees: { name: string; email: string }[];
  createdAt: string;
  updatedAt: string;
}

export async function fetchBookings(params: {
  status?: string;
  afterStart?: string;
  beforeEnd?: string;
  q?: string;
  take?: number;
} = {}): Promise<CalBooking[]> {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.afterStart) sp.set("afterStart", params.afterStart);
  if (params.beforeEnd) sp.set("beforeEnd", params.beforeEnd);
  if (params.q) sp.set("q", params.q);
  if (typeof params.take === "number") sp.set("take", String(params.take));
  const res = await fetch(`/api/cal/bookings?${sp.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Cal.com: ${res.statusText}`);
  const json = await res.json();
  return (json?.data || []) as CalBooking[];
}
