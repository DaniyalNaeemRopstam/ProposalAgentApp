/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === "production";
const PRODUCTION_API_BACKEND =
  "https://proposalagentapp-production.up.railway.app";

function isFrontendHostUrl(url) {
  if (!url) return false;
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.endsWith(".vercel.app") || h.endsWith(".netlify.app");
  } catch {
    return false;
  }
}

function resolveApiBackend() {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? process.env.API_BACKEND_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (raw && !isFrontendHostUrl(raw)) return raw;
  if (!isProduction) return "http://127.0.0.1:5000";
  return PRODUCTION_API_BACKEND;
}

const apiBackend = resolveApiBackend();

let apiHostname = "";
try {
  if (apiBackend) {
    apiHostname = new URL(apiBackend).hostname;
  }
} catch {
  /* ignore malformed URL during local tooling */
}

/** Next.js ↔ remote image hosts (not browser CORS; the API enforces Origin allow-list). */
const nextConfig = {
  transpilePackages: [
    "@proposalagent/shared",
    "@proposalagent/ui",
    "@proposalagent/api-client",
  ],
  async rewrites() {
    // Belt-and-suspenders; primary proxy is app/api/[...path]/route.ts
    if (!apiBackend || isFrontendHostUrl(apiBackend)) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${apiBackend}/api/:path*`,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-native$": "react-native-web",
    };
    config.resolve.extensions = [
      ".web.js",
      ".web.jsx",
      ".web.ts",
      ".web.tsx",
      ...config.resolve.extensions,
    ];
    return config;
  },
  images: {
    remotePatterns: [
      ...(apiHostname
        ? [{ protocol: "https", hostname: apiHostname, pathname: "/**" }]
        : []),
      { protocol: "https", hostname: "railway.app", pathname: "/**" },
      { protocol: "https", hostname: "*.railway.app", pathname: "/**" },
      ...(process.env.NEXT_PUBLIC_INCLUDE_LOCALHOST_IMAGES === "true" || !isProduction
        ? [
            {
              protocol: "http",
              hostname: "localhost",
              port: "5000",
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
