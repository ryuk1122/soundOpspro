import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/lib/auth";
import { colors, fonts, radius, spacing } from "@/src/lib/theme";

export default function Index() {
  const { user, ready } = useAuth();
  const router = useRouter();
  // FIX Bug 2: evita una doble navegacion si "ready" y "user" cambian en el
  // mismo tick (por ejemplo justo despues de signOut), lo que en algunos
  // dispositivos Android generaba una condicion de carrera visual donde la
  // pantalla parpadeaba entre tabs y login antes de asentarse.
  const lastTarget = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    const target = user ? "/(tabs)" : "/(auth)/login";
    if (lastTarget.current === target) return;
    lastTarget.current = target;
    router.replace(target);
  }, [ready, router, user]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(45,212,191,0.22)", "rgba(255,159,10,0.16)", colors.surface]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.logo}>
        <Ionicons name="pulse" size={34} color={colors.onBrand} />
      </View>
      <Text style={styles.name}>SoundOps Pro</Text>
      <Text style={styles.subtitle}>Inventario, logistica y control acustico</Text>
      <View style={styles.statusCard}>
        <ActivityIndicator color={colors.brand} />
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <Text style={styles.statusTitle}>Abriendo centro de control</Text>
          <Text style={styles.statusText}>Verificando sesion y almacenamiento seguro</Text>
        </View>
      </View>
      <View style={styles.moduleRow}>
        {["Equipos", "Eventos", "SPL"].map((label) => (
          <View key={label} style={styles.modulePill}>
            <Text style={styles.moduleText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  logo: {
    width: 86,
    height: 86,
    borderRadius: 24,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  name: { fontFamily: fonts.displayBold, color: colors.onSurface, fontSize: 34, letterSpacing: 0 },
  subtitle: {
    fontFamily: fonts.text,
    color: colors.onSurfaceSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  statusCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26,29,36,0.88)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  statusTitle: { fontFamily: fonts.textSemi, color: colors.onSurface, fontSize: 15 },
  statusText: { fontFamily: fonts.text, color: colors.onSurfaceTertiary, fontSize: 12, marginTop: 2 },
  moduleRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  modulePill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(26,29,36,0.72)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  moduleText: { fontFamily: fonts.textMedium, color: colors.onSurfaceSecondary, fontSize: 12 },
});
