import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Vendored zxing. The path carries the version, so a bump changes the
        // URL and immutable is safe. Without it a phone would hold a stale
        // decoder for a year.
        //
        // decoder-worker.js is deliberately not covered. It is our code, and
        // caching it this way would stop our own edits reaching a returning
        // phone.
        source: "/scan/vendor/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
