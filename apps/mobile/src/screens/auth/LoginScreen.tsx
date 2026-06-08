import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { TextInput } from "../../components/ui/TextInput";
import { useAuth } from "../../hooks/useAuth";
import { offerBiometricEnrollment } from "../../lib/biometricPrompt";
import { formatAuthError } from "../../lib/authApiErrors";
import { AuthConfigBanner } from "../../components/auth/AuthConfigBanner";
import { colors } from "../../theme/colors";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();

  const validateForm = () => {
    let isValid = true;
    
    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email");
      isValid = false;
    } else {
      setEmailError("");
    }
    
    if (!password.trim()) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    } else {
      setPasswordError("");
    }
    
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      await offerBiometricEnrollment();
      router.replace("/(tabs)");
    } catch (e) {
      setSubmitError(formatAuthError(e, "sign-in"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to your ProposalAgent account
              </Text>
            </View>

            <AuthConfigBanner />

            <View style={styles.form}>
              <TextInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                error={emailError}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                error={passwordError}
                placeholder="Enter your password"
                secureTextEntry
                autoComplete="current-password"
              />

              {submitError ? (
                <Text style={styles.errorMessage}>{submitError}</Text>
              ) : null}

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={submitting}
                style={styles.loginButton}
              />

              {submitError ? (
                <Button
                  title="Retry"
                  variant="ghost"
                  onPress={handleLogin}
                  loading={submitting}
                  disabled={submitting}
                  style={styles.retryButton}
                />
              ) : null}
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don't have an account?{" "}
                <Link href="/auth/register" style={styles.link}>
                  Sign up
                </Link>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  loginButton: {
    marginTop: 8,
  },
  retryButton: {
    marginTop: 4,
  },
  errorMessage: {
    color: colors.danger,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: `${colors.danger}20`,
    borderRadius: 8,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
  link: {
    color: colors.accent,
    fontWeight: "600",
  },
});