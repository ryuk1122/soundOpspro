import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/lib/auth";
import { colors, fonts, radius, spacing } from "@/src/lib/theme";

export default function Index() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [introDone, setIntroDone] = useState(false);
  const pulse = useMemo(() => new Animated.Value(0), []);
  const orbit = useMemo(() => new Animated.Value(0), []);
  const scan = useMemo(() => new Animated.Value(0), []);
  const barA = useMemo(() => new Animated.Value(0.4), []);
  const barB = useMemo(() => new Animated.Value(0.85), []);
  const barC = useMemo(() => new Animated.Value(0.55), []);
  // FIX Bug 2: evita una doble navegacion si "ready" y "user" cambian en el
  // mismo tick (por ejemplo justo despues de signOut), lo que en algunos
  // dispositivos Android generaba una condicion de carrera visual donde la
  // pantalla parpadeaba entre tabs y login antes de asentarse.
  const lastTarget = useRef<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIntroDone(true), 900);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || !introDone) return;
    const target = user ? "/(tabs)" : "/(auth)/login";
    if (lastTarget.current === target) return;
    lastTarget.current = target;
    router.replace(target);
  }, [introDone, ready, router, user]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
        Animated.timing(orbit, { toValue: 1, duration: 5200, easing: Easing.linear, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(scan, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(scan, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(barA, { toValue: 1, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(barA, { toValue: 0.35, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(barB, { toValue: 0.35, duration: 580, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(barB, { toValue: 1, duration: 580, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(barC, { toValue: 0.95, duration: 460, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(barC, { toValue: 0.45, duration: 460, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [barA, barB, barC, orbit, pulse, scan]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.28] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.78, 0] });
  const orbitSpin = orbit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const scanX = scan.interpolate({ inputRange: [0, 1], outputRange: [-88, 88] });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(255,159,10,0.24)", "rgba(45,212,191,0.16)", colors.surface]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.logoStage}>
        <Animated.View style={[styles.energyRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
        <Animated.View style={[styles.energyRingAlt, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
        <Animated.View style={[styles.orbit, { transform: [{ rotate: orbitSpin }] }]}>
          <View style={[styles.orbitDot, styles.orbitDotAmber]} />
          <View style={[styles.orbitDot, styles.orbitDotCyan]} />
        </Animated.View>
        <View style={styles.logoCore}>
          <Animated.View style={[styles.scanBeam, { transform: [{ translateX: scanX }, { rotate: "18deg" }] }]} />
          <View style={styles.speakerFace}>
            <View style={styles.smallDriver}>
              <View style={styles.driverCenter} />
            </View>
            <View style={styles.waveRow}>
              <Animated.View style={[styles.waveBar, { backgroundColor: colors.accent, transform: [{ scaleY: barA }] }]} />
              <Animated.View style={[styles.waveBarTall, { transform: [{ scaleY: barB }] }]} />
              <Animated.View style={[styles.waveBar, { backgroundColor: colors.info, transform: [{ scaleY: barC }] }]} />
              <Animated.View style={[styles.waveBarTall, { transform: [{ scaleY: barA }] }]} />
              <Animated.View style={[styles.waveBar, { backgroundColor: colors.accent, transform: [{ scaleY: barB }] }]} />
            </View>
            <View style={styles.bigDriver}>
              <View style={styles.bigDriverCenter} />
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeStart} />
          <View style={styles.routeEnd} />
        </View>
      </View>
      <Text style={styles.name}>SoundOps Pro</Text>
      <Text style={styles.subtitle}>Inventario, logistica y control acustico</Text>
      <View style={styles.statusCard}>
        <View style={styles.statusPulse}>
          <Ionicons name="radio-outline" size={18} color={colors.brand} />
        </View>
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <Text style={styles.statusTitle}>Sincronizando cabina</Text>
          <Text style={styles.statusText}>Railway, Firebase y Cloudinary listos</Text>
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
  logoStage: {
    width: 166,
    height: 166,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  energyRing: {
    position: "absolute",
    width: 138,
    height: 138,
    borderRadius: 69,
    borderWidth: 2,
    borderColor: "rgba(255,159,10,0.72)",
  },
  energyRingAlt: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: "rgba(45,212,191,0.72)",
  },
  orbit: {
    position: "absolute",
    width: 154,
    height: 154,
    borderRadius: 77,
  },
  orbitDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(15,17,21,0.8)",
  },
  orbitDotAmber: { top: 4, left: 72, backgroundColor: colors.brand },
  orbitDotCyan: { bottom: 10, right: 30, backgroundColor: colors.accent },
  logoCore: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: "rgba(26,29,36,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: colors.brand,
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  scanBeam: {
    position: "absolute",
    width: 20,
    height: 150,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  speakerFace: {
    width: 72,
    height: 84,
    borderRadius: 18,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  smallDriver: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  driverCenter: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.onSurfaceSecondary },
  bigDriver: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 4,
    borderColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  bigDriverCenter: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.surface },
  waveRow: { flexDirection: "row", alignItems: "center", height: 22, gap: 4 },
  waveBar: { width: 4, height: 18, borderRadius: 2, backgroundColor: colors.brand },
  waveBarTall: { width: 4, height: 22, borderRadius: 2, backgroundColor: colors.brand },
  routeLine: {
    position: "absolute",
    width: 92,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(45,212,191,0.58)",
    transform: [{ rotate: "-32deg" }],
  },
  routeStart: {
    position: "absolute",
    left: 13,
    bottom: 21,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  routeEnd: {
    position: "absolute",
    right: 14,
    top: 20,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.brand,
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
  statusPulse: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brandTertiary,
    borderWidth: 1,
    borderColor: "rgba(255,159,10,0.45)",
    alignItems: "center",
    justifyContent: "center",
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
