import "react-native-gesture-handler";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "../src/theme/colors";
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import {
  queryClient,
  rqAsyncStoragePersister,
  rqPersistDehydrateOptions,
} from "../src/lib/reactQuery";
import { AppBootstrap } from "../src/providers/AppBootstrap";
import { AuthProvider } from "../src/context/AuthContext";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: rqAsyncStoragePersister,
            maxAge: 1000 * 60 * 60 * 24,
            dehydrateOptions: rqPersistDehydrateOptions,
          }}
        >
          <AuthProvider>
            <AppBootstrap>
              <StatusBar style="light" backgroundColor={colors.bg} />
              <Stack
                screenOptions={{
                  headerStyle: {
                    backgroundColor: colors.surface,
                  },
                  headerTintColor: colors.text,
                  headerTitleStyle: {
                    fontWeight: "600",
                  },
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </AppBootstrap>
          </AuthProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
