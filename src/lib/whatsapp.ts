import type { Tables } from "./database.types";

type Rsvp = Tables<"rsvps">;

/** Normalizes a phone number into the digits-only format wa.me expects. */
function normalizeWhatsappNumber(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

export function buildRsvpSummaryMessage(params: {
  groomName: string;
  brideName: string;
  weddingDateLabel: string;
  rsvps: Rsvp[];
}): string {
  const { groomName, brideName, weddingDateLabel, rsvps } = params;
  const attending = rsvps.filter((r) => r.attending === "yes");
  const notAttending = rsvps.filter((r) => r.attending === "no");
  const totalGuests = attending.reduce((sum, r) => {
    const n = parseInt(r.guests ?? "1", 10);
    return sum + (Number.isFinite(n) ? n : 1);
  }, 0);

  const lines = [
    `RSVP Summary — ${groomName} & ${brideName}'s Wedding (${weddingDateLabel})`,
    "",
    `Total responses: ${rsvps.length}`,
    `Attending: ${attending.length} (approx. ${totalGuests} guests)`,
    `Not attending: ${notAttending.length}`,
    "",
    "Attending guests:",
    ...(attending.length
      ? attending.map(
          (r) => `• ${r.name}${r.phone ? ` (${r.phone})` : ""} — ${r.guests ?? "1"} guest(s)`,
        )
      : ["  (none yet)"]),
  ];

  return lines.join("\n");
}

export function buildWhatsappSendUrl(whatsappNumber: string, message: string): string | null {
  const digits = normalizeWhatsappNumber(whatsappNumber);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Days remaining until the wedding date, or null if no date is set. Can be negative if past. */
export function daysUntil(weddingDate: string | null): number | null {
  if (!weddingDate) return null;
  const target = new Date(weddingDate).getTime();
  if (Number.isNaN(target)) return null;
  const now = Date.now();
  return Math.ceil((target - now) / 86_400_000);
}
