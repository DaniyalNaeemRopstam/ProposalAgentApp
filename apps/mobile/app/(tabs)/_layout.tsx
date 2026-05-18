import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { GuestBanner } from "../../src/components/GuestBanner";
import { OfflineBanner } from "../../src/components/OfflineBanner";
import { colors } from "../../src/theme/colors";

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <GuestBanner />
      <OfflineBanner />
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: "500",
            },
            headerStyle: {
              backgroundColor: colors.surface,
              shadowOpacity: 0,
              elevation: 0,
            },
            headerTintColor: colors.text,
            headerTitleStyle: {
              fontWeight: "600",
              fontSize: 18,
            },
          }}
        >
          <Tabs.Screen
            name="jobs"
            options={{
              title: "Jobs",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="briefcase-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="proposal"
            options={{
              href: null,
              title: "Proposal",
            }}
          />
          <Tabs.Screen
            name="proposals"
            options={{
              title: "Proposals",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="document-text-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="sequences"
            options={{
              title: "Sequences",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="time-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="pipeline"
            options={{
              title: "Pipeline",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="analytics-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="analytics"
            options={{
              title: "Analytics",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="bar-chart-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: "Settings",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="cog-outline" size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}
