import crypto from "crypto";
import { promisify } from "util";

// Custom error classes for better error handling
class EncryptionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "EncryptionError";
  }
}

class DecryptionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "DecryptionError";
  }
}

// Configuration and initialization
const ENCRYPTION_METHOD = "aes-256-cbc";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

// Validate environment variables
if (!process.env.CREDENTIALS_ENCRYPTION_KEY) {
  throw new Error(
    "CREDENTIALS_ENCRYPTION_KEY environment variable is required"
  );
}

const secretKey = process.env.CREDENTIALS_ENCRYPTION_KEY;

// Promisify crypto functions
const randomBytes = promisify(crypto.randomBytes);
const scrypt = promisify(crypto.scrypt);

// Initialize key and IV (now async)
async function initializeCrypto() {
  try {
    // Generate a secure key using scrypt
    const key = (await scrypt(secretKey, "salt", KEY_LENGTH)) as Buffer;

    // Generate a random IV for each encryption
    const iv = await randomBytes(IV_LENGTH);

    return { key, iv };
  } catch (error) {
    throw new EncryptionError("Failed to initialize crypto", error as Error);
  }
}

// Encrypt function
export async function encrypt(text: string): Promise<string> {
  try {
    if (!text) {
      throw new EncryptionError("Text to encrypt cannot be empty");
    }

    const { key, iv } = await initializeCrypto();

    const cipher = crypto.createCipheriv(ENCRYPTION_METHOD, key, iv);

    // Combine IV and encrypted content
    const encrypted = Buffer.concat([
      iv,
      cipher.update(Buffer.from(text, "utf8")),
      cipher.final(),
    ]);

    return encrypted.toString("base64");
  } catch (error) {
    if (error instanceof EncryptionError) {
      throw error;
    }
    throw new EncryptionError("Encryption failed", error as Error);
  }
}

// Decrypt function
export async function decrypt(encryptedText: string): Promise<string> {
  try {
    if (!encryptedText) {
      throw new DecryptionError("Encrypted text cannot be empty");
    }

    // Convert from base64 and extract IV
    const encrypted = Buffer.from(encryptedText, "base64");

    if (encrypted.length < IV_LENGTH) {
      throw new DecryptionError("Invalid encrypted data format");
    }

    const iv = encrypted.subarray(0, IV_LENGTH);
    const content = encrypted.subarray(IV_LENGTH);

    const { key } = await initializeCrypto();

    const decipher = crypto.createDecipheriv(ENCRYPTION_METHOD, key, iv);

    const decrypted = Buffer.concat([
      decipher.update(content),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    if (error instanceof DecryptionError) {
      throw error;
    }
    throw new DecryptionError("Decryption failed", error as Error);
  }
}
