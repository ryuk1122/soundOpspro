import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Button, TextField } from "@/src/components/ui";
import { useAuth } from "@/src/lib/auth";
import { colors, fonts, images, spacing } from "@/src/lib/theme";

export default function Login() {
  const { login, user, ready } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/(tabs)");
  }, [ready, router, user]);

  const submit = async () => {
    setError("");
    if (!email || !password) { setError("Enter your email and password"); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Image source={{ uri: images.dashboardHero }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={["rgba(15,17,21,0.2)", "rgba(15,17,21,0.85)", colors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.brandRow, { marginTop: insets.top + spacing.lg }]}>
          <View style={styles.logo}>
            <Ionicons name="pulse" size={22} color={colors.onBrand} />
          </View>
          <Text style={styles.brandName}>SoundOps Pro</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Command Center</Text>
          <Text style={styles.subtitle}>Control inventory, event deployments and returns from one workspace.</Text>

          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Railway API online</Text>
            <Text style={styles.liveDivider}>/</Text>
            <Text style={styles.liveText}>Firebase synced</Text>
          </View>

          <TextField testID="login-email-input" label="Email" value={email} onChangeText={setEmail}
            autoCapitalize="none" keyboardType="email-address" placeholder="you@studio.com" />
          <TextField testID="login-password-input" label="Password" value={password} onChangeText={setPassword}
            secureTextEntry placeholder="••••••••" />

          {error ? <Text testID="login-error" style={styles.error}>{error}</Text> : null}

          <Button testID="login-submit-button" title="Sign In" onPress={submit} loading={loading} icon="log-in-outline" />

          <Pressable testID="go-register" onPress={() => router.push("/(auth)/register")} style={styles.switchRow}>
            <Text style={styles.switchText}>
              New here? <Text style={styles.switchLink}>Create an account</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.surface },
  hero: { height: 260, justifyContent: "flex-start" },
  brandRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg },
  logo: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginRight: spacing.sm },
  brandName: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.onSurface, letterSpacing: 0.5 },
  form: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontFamily: fonts.displayBold, fontSize: 32, color: colors.onSurface },
  subtitle: { fontFamily: fonts.text, fontSize: 15, color: colors.onSurfaceSecondary, marginBottom: spacing.xl },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success, marginRight: spacing.sm },
  liveText: { fontFamily: fonts.textMedium, color: colors.onSurfaceSecondary, fontSize: 12 },
  liveDivider: { color: colors.onSurfaceTertiary, marginHorizontal: spacing.sm },
  error: { color: colors.error, fontFamily: fonts.textMedium, fontSize: 13, marginBottom: spacing.md },
  switchRow: { marginTop: spacing.xl, alignItems: "center" },
  switchText: { fontFamily: fonts.text, color: colors.onSurfaceSecondary, fontSize: 14 },
  switchLink: { color: colors.brand, fontFamily: fonts.textSemi },
});
