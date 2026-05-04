import { Pressable, Text, StyleSheet, type PressableProps } from "react-native";

export type PrimaryButtonProps = PressableProps & {
  title: string;
};

export function PrimaryButton({ title, style, ...rest }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [
        styles.base,
        state.pressed && styles.pressed,
        typeof style === "function" ? style(state) : style,
      ]}
      {...rest}
    >
      <Text style={styles.label}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
