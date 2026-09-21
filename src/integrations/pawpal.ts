import { createHmac, timingSafeEqual } from "node:crypto";

export function createPawPalReference(
  orderId: number,
  totalCents: number,
  apiKey: string,
): string {
  const payload = `${orderId}:${totalCents}`;
  const signature = createHmac("sha256", apiKey)
    .update(payload)
    .digest("hex")
    .slice(0, 16);
  return `pawpal_${orderId}_${signature}`;
}

export function createPawPalCheckoutUrl(orderId: number): string {
  const checkoutUrl = new URL("https://pawpal.example/checkout");
  checkoutUrl.searchParams.set("orderId", String(orderId));
  return checkoutUrl.toString();
}

export type PawPalWebhookVerification =
  | { outcome: "unauthorized" }
  | { outcome: "malformed" }
  | { outcome: "approved"; orderId: number };

export function verifyPawPalWebhook(
  providedKey: string | undefined,
  expectedKey: string,
  payload: unknown,
): PawPalWebhookVerification {
  if (!pawPalWebhookKeysMatch(providedKey, expectedKey)) {
    return { outcome: "unauthorized" };
  }

  if (!payload || typeof payload !== "object") {
    return { outcome: "malformed" };
  }

  const payloadRecord = payload as Record<string, unknown>;
  const orderId = payloadRecord.orderId;
  if (
    typeof orderId !== "number" ||
    !Number.isSafeInteger(orderId) ||
    orderId <= 0 ||
    payloadRecord.status !== "approved"
  ) {
    return { outcome: "malformed" };
  }

  return { outcome: "approved", orderId };
}

function pawPalWebhookKeysMatch(
  provided: string | undefined,
  expected: string,
): boolean {
  if (!provided) {
    return false;
  }

  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return (
    providedBytes.length === expectedBytes.length &&
    timingSafeEqual(providedBytes, expectedBytes)
  );
}
