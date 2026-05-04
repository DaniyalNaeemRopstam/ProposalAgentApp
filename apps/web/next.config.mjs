/** @type {import('next').NextConfig} */
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
};

export default nextConfig;
