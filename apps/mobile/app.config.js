export default {
  expo: {
    name: "ProposalAgent",
    slug: "proposalagent",
    scheme: "proposalagent",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "dark",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#0A0C10"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.proposalagent.mobile"
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#0A0C10"
      },
      package: "com.proposalagent.mobile"
    },
    plugins: ["expo-router"],
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000",
    },
  }
};