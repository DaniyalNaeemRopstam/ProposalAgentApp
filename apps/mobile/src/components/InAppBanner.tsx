import React, { useEffect } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

export interface InAppBannerProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  onDismiss?: () => void;
  autoDismissMs?: number;
}

export function InAppBanner({
  title,
  subtitle,
  onPress,
  onDismiss,
  autoDismissMs = 4000,
}: InAppBannerProps) {
  const translateY = React.useRef(new Animated.Value(-100)).current;
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy < -30) {
          dismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  };

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      dismiss();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs, translateY]);

  const animatedStyle = {
    transform: [{ translateY }],
  };

  return (
    <Animated.View
      style={[styles.banner, animatedStyle]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        onPress={() => {
          dismiss();
          onPress?.();
        }}
        activeOpacity={0.8}
        style={styles.content}
      >
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    zIndex: 1000,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    paddingVertical: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
});
