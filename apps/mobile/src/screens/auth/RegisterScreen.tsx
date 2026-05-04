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
import { Button } from "../../components/ui/Button";
import { TextInput } from "../../components/ui/TextInput";
import { useRegister } from "../../hooks/useAuth";
import { colors } from "../../theme/colors";

export function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const register = useRegister();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }
    
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (!validateForm()) return;
    
    register.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        companyName: companyName.trim(),
        password,
      },
      {
        onSuccess: () => {
          router.replace("/(tabs)");
        },
      }
    );
  };

  return (
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join ProposalAgent and start winning more clients
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              placeholder="Your full name"
              autoComplete="name"
            />

            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInput
              label="Company Name"
              value={companyName}
              onChangeText={setCompanyName}
              error={errors.companyName}
              placeholder="Your company or business name"
              autoComplete="organization"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              placeholder="Create a password"
              secureTextEntry
              autoComplete="new-password"
            />

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              autoComplete="new-password"
            />

            {register.error && (
              <Text style={styles.errorMessage}>
                {register.error.message}
              </Text>
            )}

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={register.isPending}
              style={styles.registerButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Link href="/auth/login" style={styles.link}>
                Sign in
              </Link>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 32,
  },
  registerButton: {
    marginTop: 8,
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