import * as z from "zod";

/** The API applies the same rule to every way a password is set. */
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
  .max(PASSWORD_MAX, `Use ${PASSWORD_MAX} characters or fewer`);

// No 0/O or 1/l/I: a handed-over password is often read out loud.
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LENGTH = 16;

/** Four groups of four from 56 characters, about 93 bits. Rejection sampling keeps it uniform. */
export function generatePassword() {
  const limit = 256 - (256 % ALPHABET.length);
  const chars: string[] = [];
  while (chars.length < LENGTH) {
    for (const byte of crypto.getRandomValues(new Uint8Array(32))) {
      if (byte < limit && chars.length < LENGTH) chars.push(ALPHABET.charAt(byte % ALPHABET.length));
    }
  }
  return [0, 4, 8, 12].map((start) => chars.slice(start, start + 4).join("")).join("-");
}
