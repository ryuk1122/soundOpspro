import { useState } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Button, TextField } from "@/src/components/ui";
import { useAuth } from "@/src/lib/auth";
import { colors, fonts, spacing } from "@/src/lib/theme";

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!name || !email || !password) { setError("Todos los campos son obligatorios"); return; }
    if (password.length < 6) { setError("La contrasena debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    try {
      await register(email.trim(), name.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <Pressable testID="back-to-login" onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
      </Pressable>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Configura tu espacio de trabajo de audio profesional.</Text>

          <TextField testID="register-name-input" label="Nombre completo" value={name} onChangeText={setName} placeholder="Alex Sonido" />
          <TextField testID="register-email-input" label="Correo" value={email} onChangeText={setEmail}
            autoCapitalize="none" keyboardType="email-address" placeholder="tucorreo@estudio.com" />
          <TextField testID="register-password-input" label="Contrasena" value={password} onChangeText={setPassword}
            secureTextEntry placeholder="Minimo 6 caracteres" />

          {error ? <Text testID="register-error" style={styles.error}>{error}</Text> : null}

          <Button testID="register-submit-button" title="Crear cuenta" onPress={submit} loading={loading} icon="person-add-outline" />

          <Pressable testID="go-login" onPress={() => router.back()} style={styles.switchRow}>
            <Text style={styles.switchText}>
              Ya tienes cuenta? <Text style={styles.switchLink}>Entrar</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.lg },
  back: { width: 40, height: 40, justifyContent: "center" },
  form: { paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  title: { fontFamily: fonts.displayBold, fontSize: 32, color: colors.onSurface },
  subtitle: { fontFamily: fonts.text, fontSize: 15, color: colors.onSurfaceSecondary, marginBottom: spacing.xl },
  error: { color: colors.error, fontFamily: fonts.textMedium, fontSize: 13, marginBottom: spacing.md },
  switchRow: { marginTop: spacing.xl, alignItems: "center" },
  switchText: { fontFamily: fonts.text, color: colors.onSurfaceSecondary, fontSize: 14 },
  switchLink: { color: colors.brand, fontFamily: fonts.textSemi },
});
