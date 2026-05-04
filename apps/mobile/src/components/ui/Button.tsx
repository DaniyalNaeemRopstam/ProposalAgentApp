import React from "react";
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  type TouchableOpacityProps 
} from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/fonts";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "ghost" | "success";
  loading?: boolean;
  size?: "small" | "medium" | "large";
}

export function Button({ 
  title, 
  variant = "primary", 
  loading = false, 
  size = "medium",
  style,
  disabled,
  ...props 
}: ButtonProps) {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.text : colors.accent}
          size="small"
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: colors.border,
  },
  success: {
    backgroundColor: colors.successDim,
    borderColor: colors.success,
  },
  disabled: {
    opacity: 0.5,
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  text: {
    fontFamily: fonts.semiBold,
    textAlign: "center",
  },
  primaryText: {
    color: colors.text,
    fontSize: 14,
  },
  ghostText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  successText: {
    color: colors.success,
    fontSize: 14,
  },
  disabledText: {
    opacity: 0.7,
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },
});