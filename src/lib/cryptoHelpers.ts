import crypto from "crypto";

const secretKey = process.env.CREDENTIALS_ENCRYPTION_KEY!;
const secretIv = secretKey;
const encryptionMethod = "aes-256-cbc";

const key = crypto
  .createHash("sha512")
  .update(secretKey)
  .digest("hex")
  .substring(0, 32);

const encryptionIV = crypto
  .createHash("sha512")
  .update(secretIv)
  .digest("hex")
  .substring(0, 16);

export const encrypt = (text: string) => {
  const cipher = crypto.createCipheriv(encryptionMethod, key, encryptionIV);
  return Buffer.from(
    cipher.update(text, "utf8", "hex") + cipher.final("hex")
  ).toString("base64"); // Encrypts data and converts to hex and base64
};

// Decrypt Function
export const decrypt = (text: string) => {
  const buff = Buffer.from(text, "base64");
  const decipher = crypto.createDecipheriv(encryptionMethod, key, encryptionIV);
  return (
    decipher.update(buff.toString("utf8"), "hex", "utf8") +
    decipher.final("utf8")
  ); // Decrypts data and converts to utf8
};

const cache = new Map<string, string>();

export const getDecryptedCredentials = (data: string) => {
  if (cache.has(data)) return cache.get(data);

  const decrypted = decrypt(data);
  cache.set(data, decrypted); // Cache decrypted data
  return decrypted;
};
