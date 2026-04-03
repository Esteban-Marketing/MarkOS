import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getSecret(env: NodeJS.ProcessEnv): string {
  const secret = env.MARKOS_VAULT_SECRET;
  if (!secret) {
    throw new Error("INVALID_CONFIG: MARKOS_VAULT_SECRET is required for encryption");
  }

  return secret;
}

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

function buildAad(operatorId: string): Buffer {
  return Buffer.from(`markos-operator:${operatorId}`, "utf8");
}

export function redactKeyForLogging(key: string): string {
  if (key.length <= 12) {
    return "***";
  }

  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

export async function encryptOperatorKey(
  plaintextKey: string,
  operatorId: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ encryptedKey: string; keyHash: string }> {
  if (!plaintextKey) {
    throw new Error("INVALID_CONFIG: plaintextKey is required");
  }

  const key = deriveKey(getSecret(env));
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  cipher.setAAD(buildAad(operatorId));

  const encrypted = Buffer.concat([cipher.update(plaintextKey, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const keyHash = createHash("sha256").update(plaintextKey).digest("hex");
  const payload = [iv.toString("base64url"), authTag.toString("base64url"), encrypted.toString("base64url")].join(".");

  return {
    encryptedKey: `v1:${payload}`,
    keyHash,
  };
}

export async function decryptOperatorKey(
  encryptedKey: string,
  operatorId: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  if (!encryptedKey.startsWith("v1:")) {
    throw new Error("INVALID_CONFIG: unsupported encrypted key format");
  }

  const [ivEncoded, tagEncoded, cipherEncoded] = encryptedKey.slice(3).split(".");
  if (!ivEncoded || !tagEncoded || !cipherEncoded) {
    throw new Error("INVALID_CONFIG: encrypted key payload is malformed");
  }

  const key = deriveKey(getSecret(env));
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivEncoded, "base64url"), {
    authTagLength: TAG_LENGTH,
  });
  decipher.setAAD(buildAad(operatorId));
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(cipherEncoded, "base64url")),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}