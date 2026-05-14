const defaultApiUrl = "http://localhost:5000";
const resolvedApiUrl = (process.env.EXPO_PUBLIC_API_URL || defaultApiUrl).replace(/\/$/, "");

module.exports = {
  expo: {
    name: "ProposalAgent",
    slug: "proposal-agent",
    scheme: "proposalagent",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "dark",
    icon: "./assets/icon.png",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#07090F",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.danielforge.proposalagent",
    },
    android: {
      package: "com.danielforge.proposalagent",
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#07090F",
      },
      /** Required for HTTP calls to dev machine (e.g. http://10.0.2.2:5000 from emulator). Not used for HTTPS production API. */
      usesCleartextTraffic: /^http:\/\//i.test(resolvedApiUrl),
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          sounds: [],
        },
      ],
    ],
    extra: {
      apiUrl: resolvedApiUrl,
    },
  },
};
