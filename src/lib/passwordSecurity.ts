const PBKDF2_ITERATIONS = 210_000;
const HASH_VERSION = "pbkdf2-sha256";

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export async function hashPassword(password: string): Promise<string> {
  const cleanPassword = password.trim();
  if (cleanPassword.length < 8) {
    throw new Error("Password must contain at least 8 characters.");
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(cleanPassword),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );

  return [
    HASH_VERSION,
    PBKDF2_ITERATIONS,
    toBase64Url(salt),
    toBase64Url(new Uint8Array(derivedBits))
  ].join("$");
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [version, iterationsText, saltText, expectedText] = storedHash.split("$");
    const iterations = Number(iterationsText);
    if (version !== HASH_VERSION || !Number.isSafeInteger(iterations) || !saltText || !expectedText) {
      return false;
    }

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password.trim()),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: fromBase64Url(saltText), iterations, hash: "SHA-256" },
      keyMaterial,
      256
    );
    const actual = new Uint8Array(derivedBits);
    const expected = fromBase64Url(expectedText);
    if (actual.length !== expected.length) return false;

    let difference = 0;
    for (let index = 0; index < actual.length; index += 1) {
      difference |= actual[index] ^ expected[index];
    }
    return difference === 0;
  } catch {
    return false;
  }
}
