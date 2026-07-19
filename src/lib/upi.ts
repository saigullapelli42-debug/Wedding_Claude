/**
 * Builds a scannable UPI QR code image URL directly from a UPI ID, using a
 * free QR-rendering API. No image upload needed — this is generated on the
 * fly from whatever UPI ID is saved in Gift settings.
 */
export function buildUpiQrUrl(upiId: string, accountName: string, size = 240): string | null {
  if (!upiId.trim()) return null;
  const payload = `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(
    accountName.trim() || "Wedding Gift",
  )}&cu=INR`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}`;
}
