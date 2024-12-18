import crypto from "crypto";

// Set your encryption key (32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY!;
const IV_LENGTH = 16; // AES block size

// Encrypt Function
export const encrypt = (text: string) => {
  const iv = crypto.randomBytes(IV_LENGTH); // Generate random IV
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted; // Store IV with encrypted text
};

// Decrypt Function
export const decrypt = (text: string) => {
  const [iv, encryptedText] = text.split(":");
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    key,
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

const cache = new Map<string, string>();

export const getDecryptedCredentials = (data: string) => {
  if (cache.has(data)) return cache.get(data);

  const decrypted = decrypt(data);
  cache.set(data, decrypted); // Cache decrypted data
  return decrypted;
};
