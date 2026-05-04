import React from "react";
import { 
  TextInput as RNTextInput, 
  Text, 
  View, 
  StyleSheet,
  type TextInputProps as RNTextInputProps 
} from "react-native";
import { colors } from "../../theme/colors";

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
}

export function TextInput({ 
  label, 
  error, 
  style, 
  containerStyle,
  ...props 
}: TextInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.textDim}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
});