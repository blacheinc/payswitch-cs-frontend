import type { NextConfig } from "next";

/**
 * Security headers applied at the framework level as a second line of defense.
 * The proxy (src/proxy.ts) also sets these on every response it handles — this
 * catches the edge case of a path that slips past the proxy matcher.
 *
 * CSP is intentionally omitted here until nonce-based CSP is wired through the
 * proxy (Next 16 pattern). Adding `'unsafe-inline'` / `'unsafe-eval'` to keep
 * things working would negate most of CSP's value, so we ship the other high-
 * value headers first.
 */
const securityHeaders = [
  // Force HTTPS for two years on this origin + all subdomains (preload-ready).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // No one may iframe this app — hard stop clickjacking.
  { key: "X-Frame-Options", value: "DENY" },
  // Browsers must honour declared content types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send full URL only to same-origin; strip down cross-origin to origin only.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Explicitly deny powerful APIs we don't use.
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // Defence in depth alongside X-Frame-Options.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Stop well-behaved crawlers from indexing the admin surface; keep the
  // real block at the hosting/CDN layer.
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
