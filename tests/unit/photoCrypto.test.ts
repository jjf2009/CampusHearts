import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { decryptPhoto, detectImageType, encryptPhoto } from "@/lib/photoCrypto";

beforeAll(() => {
  process.env.PHOTO_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("photo encryption", () => {
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), randomBytes(500)]);

  it("round-trips and hides the plaintext", () => {
    const enc = encryptPhoto(jpeg);
    expect(enc.includes(jpeg.subarray(0, 32))).toBe(false);
    expect(decryptPhoto(enc)).toEqual(jpeg);
  });

  it("uses a fresh IV every time", () => {
    expect(encryptPhoto(jpeg).equals(encryptPhoto(jpeg))).toBe(false);
  });

  it("detects tampering and wrong keys", () => {
    const enc = encryptPhoto(jpeg);
    const tampered = Buffer.from(enc);
    tampered[40] ^= 1;
    expect(() => decryptPhoto(tampered)).toThrow();
    process.env.PHOTO_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    expect(() => decryptPhoto(enc)).toThrow();
  });

  it("refuses a missing or short key", () => {
    const saved = process.env.PHOTO_ENCRYPTION_KEY;
    process.env.PHOTO_ENCRYPTION_KEY = Buffer.alloc(16).toString("base64");
    expect(() => encryptPhoto(jpeg)).toThrow(/32 bytes/);
    delete process.env.PHOTO_ENCRYPTION_KEY;
    expect(() => encryptPhoto(jpeg)).toThrow(/not set/);
    process.env.PHOTO_ENCRYPTION_KEY = saved;
  });

  it("sniffs real image types only", () => {
    expect(detectImageType(jpeg)).toBe("image/jpeg");
    expect(detectImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]))).toBe("image/png");
    expect(detectImageType(Buffer.from("RIFF0000WEBPVP8 "))).toBe("image/webp");
    expect(detectImageType(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImageType(Buffer.from("%PDF-1.7 aaaaaa"))).toBeNull();
  });
});
