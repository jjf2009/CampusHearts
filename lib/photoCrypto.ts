import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Stored format: iv (12 bytes) | auth tag (16 bytes) | ciphertext
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function key(): Buffer {
  const raw = process.env.PHOTO_ENCRYPTION_KEY;
  if (!raw) throw new Error("PHOTO_ENCRYPTION_KEY is not set");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("PHOTO_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
  return buf;
}

export function encryptPhoto(plain: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
}

/** Throws if the data was tampered with or encrypted under another key. */
export function decryptPhoto(stored: Buffer): Buffer {
  const iv = stored.subarray(0, IV_LENGTH);
  const tag = stored.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = stored.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/** Sniffs the real image type from magic bytes; returns null for anything else. */
export function detectImageType(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}
