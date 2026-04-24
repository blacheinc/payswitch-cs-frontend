import { describe, it, expect, beforeEach } from "vitest";
import {
  encryptSession,
  decryptSession,
  saveSession,
  getSession,
  clearSession,
  getAccessToken,
  getRefreshToken,
  updateTokens,
  type SessionData,
} from "@/lib/session-storage";

const sample: SessionData = {
  accessToken: "access-abc",
  refreshToken: "refresh-xyz",
  userType: "org",
  user: {
    id: "u-1",
    email: "user@example.com",
    name: "Test User",
    roleLabel: "User",
    permissions: ["score_requests.list"],
    // Cast to User — runtime shape is sufficient for the storage layer.
  } as unknown as SessionData["user"],
};

describe("session-storage encryption", () => {
  it("round-trips a session payload", () => {
    const ciphertext = encryptSession(sample);
    expect(typeof ciphertext).toBe("string");
    expect(ciphertext).not.toContain("access-abc");

    const decoded = decryptSession(ciphertext);
    expect(decoded).toEqual(sample);
  });

  it("returns null on garbage input", () => {
    expect(decryptSession("not-encrypted-at-all")).toBeNull();
  });

  it("returns null when AES.decrypt produces empty output", () => {
    expect(decryptSession("")).toBeNull();
  });
});

describe("session-storage persistence", () => {
  beforeEach(() => {
    clearSession();
  });

  it("saveSession then getSession returns the same payload", () => {
    saveSession(sample);
    expect(getSession()).toEqual(sample);
  });

  it("getSession returns null when nothing stored", () => {
    expect(getSession()).toBeNull();
  });

  it("getAccessToken / getRefreshToken expose individual tokens", () => {
    saveSession(sample);
    expect(getAccessToken()).toBe("access-abc");
    expect(getRefreshToken()).toBe("refresh-xyz");
  });

  it("returns null tokens after clearSession", () => {
    saveSession(sample);
    clearSession();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getSession()).toBeNull();
  });

  it("saveSession sets a session cookie", () => {
    saveSession(sample);
    expect(document.cookie).toContain("session=");
  });

  it("clearSession expires the session cookie", () => {
    saveSession(sample);
    clearSession();
    // Either the cookie is gone, or it has a value without 'session='
    expect(document.cookie.split(";").map((c) => c.trim())).not.toContain(
      expect.stringMatching(/^session=[^;]+/),
    );
  });

  it("updateTokens replaces only the access token", () => {
    saveSession(sample);
    updateTokens("new-access");
    const current = getSession();
    expect(current?.accessToken).toBe("new-access");
    expect(current?.refreshToken).toBe(sample.refreshToken);
    expect(current?.user).toEqual(sample.user);
  });

  it("updateTokens is a no-op without a stored session", () => {
    updateTokens("ignored");
    expect(getSession()).toBeNull();
  });
});
