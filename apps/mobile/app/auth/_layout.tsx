import { Stack } from "expo-router";

/** Auth screens — optional entry; guests browse tabs without signing in. */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0A0C10" },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Sign In" }} />
      <Stack.Screen name="register" options={{ title: "Sign Up" }} />
    </Stack>
  );
}
