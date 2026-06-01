import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/fonts";

const H = Dimensions.get("window").height;

const schema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  companyName: z.string().min(1, "Company name is required").max(200),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type SignupPromptModalProps = {
  visible: boolean;
  onClose: () => void;
  onRegistered: () => void;
};

export function SignupPromptModal({
  visible,
  onClose,
  onRegistered,
}: SignupPromptModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof z.infer<typeof schema>, string>>>(
    {}
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setFormError(null);
    const parsed = schema.safeParse({ name, email, companyName, password });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors({
        name: f.name?.[0],
        email: f.email?.[0],
        companyName: f.companyName?.[0],
        password: f.password?.[0],
      });
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await register({
        name: parsed.data.name,
        email: parsed.data.email,
        companyName: parsed.data.companyName,
        password: parsed.data.password,
      });
      onRegistered();
      onClose();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.flex1} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              maxHeight: H * 0.75,
              paddingBottom: Math.max(16, insets.bottom + 12),
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.icon}>⚡</Text>
            <Text style={styles.title}>Create your free account</Text>
            <Text style={styles.sub}>
              3 free AI proposals — no credit card needed
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}
            >
              {["✓ AI proposals", "✓ Job matching", "✓ Follow-ups", "✓ Analytics"].map(
                (p) => (
                  <View key={p} style={styles.pill}>
                    <Text style={styles.pillText}>{p}</Text>
                  </View>
                )
              )}
            </ScrollView>

            {formError ? <Text style={styles.formErr}>{formError}</Text> : null}

            <Labeled
              label="Name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
            />
            <Labeled
              label="Email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Labeled
              label="Password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
            />
            <Labeled
              label="Company name"
              value={companyName}
              onChangeText={setCompanyName}
              error={errors.companyName}
              autoCapitalize="words"
            />

            <Button
              title={busy ? "Creating…" : "Create free account"}
              onPress={() => void onSubmit()}
              disabled={busy}
            />
            {busy ? <ActivityIndicator style={{ marginTop: 10 }} color={colors.accent} /> : null}

            <Pressable
              onPress={() => {
                onClose();
                router.push("/auth/login");
              }}
              style={styles.loginLink}
            >
              <Text style={styles.loginText}>Log in instead</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Labeled({
  label,
  value,
  onChangeText,
  error,
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLbl}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textDim}
        style={styles.input}
        {...rest}
      />
      {error ? <Text style={styles.fieldErr}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  flex1: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  scrollPad: { paddingHorizontal: 20, paddingBottom: 8 },
  icon: {
    fontSize: 40,
    textAlign: "center",
    marginBottom: 8,
    color: colors.accent,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    color: colors.text,
    textAlign: "center",
  },
  sub: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
  pillRow: { gap: 8, paddingBottom: 8 },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.bg,
  },
  pillText: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.medium },
  formErr: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 8,
    fontFamily: fonts.regular,
  },
  fieldLbl: {
    fontSize: 11,
    color: colors.textDim,
    marginBottom: 4,
    fontFamily: fonts.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 15,
    color: colors.text,
    fontFamily: fonts.regular,
    backgroundColor: colors.bg,
  },
  fieldErr: { color: colors.danger, fontSize: 12, marginTop: 4 },
  loginLink: { marginTop: 16, alignItems: "center" },
  loginText: { color: colors.accent, fontFamily: fonts.medium, fontSize: 15 },
});
