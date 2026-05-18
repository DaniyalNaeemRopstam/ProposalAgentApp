import { Stack } from "expo-router";

/** Auth screens — optional entry; guests browse tabs without signing in. */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0A0C10" },
      }}
    />
  );
}
