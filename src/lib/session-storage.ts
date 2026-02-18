import CryptoJS from "crypto-js";
import { User } from "@/types/models";

// ==================== SESSION DATA ====================

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  userType: string;
  user: User;
}

// Storage keys
const SESSION_KEY = "session_data";
const SESSION_COOKIE = "session";

// Encryption secret — set NEXT_PUBLIC_SESSION_SECRET in your .env
const SECRET =
  process.env.NEXT_PUBLIC_SESSION_SECRET || "__credit_scoring_session_key__";

// ==================== ENCRYPT / DECRYPT ====================

/**
 * Encrypt session data to an AES-encrypted ciphertext string.
 */
export function encryptSession(data: SessionData): string {
  const json = JSON.stringify(data);
  return CryptoJS.AES.encrypt(json, SECRET).toString();
}

/**
 * Decrypt an AES-encrypted session string back to SessionData.
 * Returns null if decryption or parsing fails.
 */
export function decryptSession(ciphertext: string): SessionData | null {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET);
    const json = bytes.toString(CryptoJS.enc.Utf8);
    if (!json) return null;
    return JSON.parse(json) as SessionData;
  } catch {
    return null;
  }
}

// ==================== PERSISTENCE ====================

/**
 * Save session data encrypted to localStorage and set a cookie for middleware access.
 */
export function saveSession(data: SessionData): void {
  if (typeof window === "undefined") return;

  const encrypted = encryptSession(data);

  // Save to localStorage for client-side use
  localStorage.setItem(SESSION_KEY, encrypted);

  // Set cookie so the proxy/middleware can read it
  // encodeURIComponent handles any special characters in the ciphertext
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(encrypted)}; path=/; max-age=86400; SameSite=Strict`;
}

/**
 * Retrieve and decrypt session data from localStorage.
 * Returns null if no session exists or decryption fails.
 */
export function getSession(): SessionData | null {
  if (typeof window === "undefined") return null;

  const encrypted = localStorage.getItem(SESSION_KEY);
  if (!encrypted) return null;

  return decryptSession(encrypted);
}

/**
 * Clear session data from localStorage and expire the cookie.
 */
export function clearSession(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(SESSION_KEY);

  // Expire the cookie
  document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
}

// ==================== CONVENIENCE ACCESSORS ====================

/**
 * Get just the access token from the stored session.
 */
export function getAccessToken(): string | null {
  return getSession()?.accessToken ?? null;
}

/**
 * Get just the refresh token from the stored session.
 */
export function getRefreshToken(): string | null {
  return getSession()?.refreshToken ?? null;
}

/**
 * Update the access token in the existing session without replacing user data.
 * The refresh token is preserved since the API does not rotate refresh tokens.
 */
export function updateTokens(accessToken: string): void {
  const session = getSession();
  if (!session) return;

  saveSession({
    ...session,
    accessToken,
  });
}
