/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === "production";

let apiHostname = "";
try {
  if (process.env.NEXT_PUBLIC_API_URL) {
    apiHostname = new URL(process.env.NEXT_PUBLIC_API_URL).hostname;
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
