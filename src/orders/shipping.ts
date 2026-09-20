import { decryptWithKeyring, deserializeEncryptedPayload, encryptWithKeyring, serializeEncryptedPayload, type Keyring } from "../storage/keyring.ts";

export type ShippingDetails = {
  name: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
};

export function encryptShippingDetails(
  details: ShippingDetails,
  keyring: Keyring | undefined,
): string {
  const plaintext = Buffer.from(JSON.stringify(details), "utf8");
  const encrypted = encryptWithKeyring(plaintext, keyring);
  return serializeEncryptedPayload(encrypted).toString("utf8");
}

export function decryptShippingDetails(
  serialized: string,
  keyring: Keyring | undefined,
): ShippingDetails {
  const encrypted = deserializeEncryptedPayload(
    Buffer.from(serialized, "utf8"),
  );
  const plaintext = decryptWithKeyring(encrypted, keyring);

  let details: unknown;
  try {
    details = JSON.parse(plaintext.toString("utf8"));
  } catch {
    throw new Error("Invalid encrypted shipping details");
  }

  if (!isShippingDetails(details)) {
    throw new Error("Invalid encrypted shipping details");
  }

  return details;
}

function isShippingDetails(details: unknown): details is ShippingDetails {
  if (!details || typeof details !== "object") {
    return false;
  }

  const candidate = details as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.address === "string" &&
    typeof candidate.city === "string" &&
    typeof candidate.region === "string" &&
    typeof candidate.postalCode === "string"
  );
}
