import { describe, it, expect } from "vitest";
import {
  resolveAppOrigin,
  sanitizeCallbackUrl,
  rewriteCallbackUrlInBody,
} from "@/lib/callback-url";

const APP = "https://payswitch-cs.vercel.app";

function jsonRequest(
  body: unknown,
  headers: Record<string, string> = { host: "payswitch-cs.vercel.app" },
) {
  return new Request("https://payswitch-cs.vercel.app/api/proxy/auth/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function bodyBuffer(value: unknown): ArrayBuffer {
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  return encoded.buffer.slice(
    encoded.byteOffset,
    encoded.byteOffset + encoded.byteLength,
  ) as ArrayBuffer;
}

function decode(buf: ArrayBuffer | undefined): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(buf!)) as Record<string, unknown>;
}

describe("resolveAppOrigin", () => {
  // APP_BASE_URL or nothing. No header/URL fallback on purpose: the backend
  // rejects unknown callbacks silently, so a guessed origin would quietly
  // send users to production.
  it("returns nothing when APP_BASE_URL is unset", () => {
    expect(resolveAppOrigin()).toBe("");
  });
});

describe("sanitizeCallbackUrl", () => {
  it("keeps an allow-listed path", () => {
    expect(sanitizeCallbackUrl("/reset-password", APP)).toBe(
      `${APP}/reset-password`,
    );
    expect(sanitizeCallbackUrl("/admin-login", APP)).toBe(`${APP}/admin-login`);
  });

  // Core of VAPT §2.2: an attacker-supplied host must never survive.
  it("discards an attacker-controlled origin but keeps the allowed path", () => {
    expect(sanitizeCallbackUrl("https://simar.space/reset-password", APP)).toBe(
      `${APP}/reset-password`,
    );
  });

  it("collapses an unknown path to the default", () => {
    expect(sanitizeCallbackUrl("https://simar.space/collect", APP)).toBe(
      `${APP}/login`,
    );
    expect(sanitizeCallbackUrl("/not-a-real-route", APP)).toBe(`${APP}/login`);
  });

  it("strips query and fragment from the caller's value", () => {
    expect(
      sanitizeCallbackUrl("/reset-password?next=https://evil.test#x", APP),
    ).toBe(`${APP}/reset-password`);
  });

  it("falls back to the default for unusable input", () => {
    expect(sanitizeCallbackUrl(undefined, APP)).toBe(`${APP}/login`);
    expect(sanitizeCallbackUrl("", APP)).toBe(`${APP}/login`);
    expect(sanitizeCallbackUrl(42, APP)).toBe(`${APP}/login`);
    expect(sanitizeCallbackUrl({ evil: true }, APP)).toBe(`${APP}/login`);
  });

  it("does not let a scheme-relative value smuggle in a host", () => {
    expect(sanitizeCallbackUrl("//simar.space/reset-password", APP)).toBe(
      `${APP}/reset-password`,
    );
  });
});

describe("rewriteCallbackUrlInBody", () => {
  // APP_BASE_URL unset here — the "no trusted origin" branch drops the field.
  it("strips an attacker-supplied callback_url when no origin is configured", () => {
    const payload = {
      email: "victim@example.com",
      callback_url: "https://simar.space/reset-password",
    };
    const out = rewriteCallbackUrlInBody(bodyBuffer(payload), jsonRequest(payload));

    expect(decode(out)).toEqual({ email: "victim@example.com" });
  });

  it("never forwards the caller's value, whatever the path", () => {
    const payload = {
      email: "victim@example.com",
      callback_url: "/reset-password",
    };
    const out = decode(
      rewriteCallbackUrlInBody(bodyBuffer(payload), jsonRequest(payload)),
    );
    expect(out).not.toHaveProperty("callback_url");
  });

  it("leaves bodies without a callback_url untouched", () => {
    const payload = { email: "someone@example.com" };
    const buf = bodyBuffer(payload);
    expect(rewriteCallbackUrlInBody(buf, jsonRequest(payload))).toBe(buf);
  });

  it("leaves non-JSON bodies untouched", () => {
    const buf = bodyBuffer({ callback_url: "https://simar.space" });
    const req = new Request("https://payswitch-cs.vercel.app/api/proxy/x", {
      method: "POST",
      headers: { "content-type": "text/plain", host: "payswitch-cs.vercel.app" },
      body: "callback_url=whatever",
    });
    expect(rewriteCallbackUrlInBody(buf, req)).toBe(buf);
  });

  it("leaves malformed JSON untouched rather than throwing", () => {
    const encoded = new TextEncoder().encode('{"callback_url": broken');
    const buf = encoded.buffer.slice(
      encoded.byteOffset,
      encoded.byteOffset + encoded.byteLength,
    ) as ArrayBuffer;
    expect(rewriteCallbackUrlInBody(buf, jsonRequest({}))).toBe(buf);
  });

  it("passes through GET requests with no body", () => {
    expect(rewriteCallbackUrlInBody(undefined, jsonRequest({}))).toBeUndefined();
  });

  it("preserves every other field in the payload", () => {
    const payload = {
      email: "victim@example.com",
      role_id: "r_123",
      name: "Ada",
      callback_url: "https://simar.space/login",
    };
    const out = decode(
      rewriteCallbackUrlInBody(bodyBuffer(payload), jsonRequest(payload)),
    );
    expect(out.email).toBe("victim@example.com");
    expect(out.role_id).toBe("r_123");
    expect(out.name).toBe("Ada");
    expect(out).not.toHaveProperty("callback_url");
  });
});
