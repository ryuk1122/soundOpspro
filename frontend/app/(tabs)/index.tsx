import { useCallback, useState } from "react";
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/lib/api";
import { Button } from "@/src/components/ui";
import { useAuth } from "@/src/lib/auth";
import { colors, fonts, images, radius, spacing } from "@/src/lib/theme";

type Stats = {
  total_gear: number; total_units: number; deployed_units: number; available_units: number;
  active_events: number;
  stock_alerts: { id: string; name: string; reason: string }[];
  recent_movements: { id: string; type: string; equipment_name: string; event_name: string; quantity: number; created_at: string }[];
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (forceRefresh = false) => {
    setError("");
    try {
      const data = await api<Stats>("/dashboard/stats", { cacheMs: 15000, forceRefresh, timeoutMs: 45000 });
      setStats(data);
    } catch (e: any) {
      setError(e?.message || "Dashboard could not load.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const metrics = [
    { label: "Gear Models", value: stats?.total_gear ?? 0, icon: "albums-outline" as const },
    { label: "Total Units", value: stats?.total_units ?? 0, icon: "cube-outline" as const },
    { label: "Deployed", value: stats?.deployed_units ?? 0, icon: "rocket-outline" as const },
    { label: "Active Events", value: stats?.active_events ?? 0, icon: "calendar-outline" as const },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.brand} />}
      >
        <View style={styles.hero}>
          <Image source={{ uri: images.dashboardHero }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={["rgba(15,17,21,0.35)", "rgba(15,17,21,0.8)", colors.surface]} style={StyleSheet.absoluteFill} />
          <View style={[styles.heroContent, { paddingTop: insets.top + spacing.lg }]}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.greeting}>Welcome back</Text>
                <Text style={styles.userName}>{user?.name ?? "Engineer"}</Text>
              </View>
              <Pressable testID="signout-button" onPress={signOut} style={styles.iconBtn}>
                <Ionicons name="log-out-outline" size={20} color={colors.onSurface} />
              </Pressable>
            </View>
            <Text style={styles.heroTitle}>Live Operations</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loader}><ActivityIndicator color={colors.brand} size="large" /></View>
        ) : error ? (
          <View style={styles.body}>
            <View style={styles.errorCard}>
              <Ionicons name="cloud-offline-outline" size={24} color={colors.error} />
              <Text style={styles.errorTitle}>Dashboard unavailable</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Button title="Retry" icon="refresh" variant="secondary" onPress={() => { setLoading(true); load(true); }} />
            </View>
          </View>
        ) : (
          <View style={styles.body}>
            <View style={styles.grid}>
              {metrics.map((m) => (
                <View key={m.label} style={styles.metricCard} testID={`metric-${m.label}`}>
                  <Ionicons name={m.icon} size={20} color={colors.brand} />
                  <Text style={styles.metricValue}>{m.value}</Text>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Stock Alerts</Text>
              <View style={styles.countPill}><Text style={styles.countPillText}>{stats?.stock_alerts.length ?? 0}</Text></View>
            </View>
            {stats && stats.stock_alerts.length > 0 ? (
              stats.stock_alerts.map((a) => (
                <Pressable key={a.id} testID={`alert-${a.id}`} onPress={() => router.push(`/equipment/${a.id}`)} style={styles.alertCard}>
                  <Ionicons name="warning" size={18} color={colors.warning} />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.alertName}>{a.name}</Text>
                    <Text style={styles.alertReason}>{a.reason}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceTertiary} />
                </Pressable>
              ))
            ) : (<Text style={styles.muted}>All gear operational and in stock.</Text>)}

            <View style={styles.sectionHeaderRow}><Text style={styles.sectionTitle}>Recent Movements</Text></View>
            {stats && stats.recent_movements.length > 0 ? (
              stats.recent_movements.map((mv) => (
                <View key={mv.id} style={styles.moveRow}>
                  <View style={[styles.moveIcon, { backgroundColor: mv.type === "out" ? `${colors.brand}22` : `${colors.success}22` }]}>
                    <Ionicons name={mv.type === "out" ? "arrow-up" : "arrow-down"} size={16} color={mv.type === "out" ? colors.brand : colors.success} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.moveName}>{mv.quantity}× {mv.equipment_name}</Text>
                    <Text style={styles.moveSub}>{mv.type === "out" ? "Deployed to" : "Returned from"} {mv.event_name}</Text>
                  </View>
                </View>
              ))
            ) : (<Text style={styles.muted}>No movements logged yet.</Text>)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: { height: 230 },
  heroContent: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: "space-between", paddingBottom: spacing.lg },
  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { fontFamily: fonts.text, color: colors.onSurfaceSecondary, fontSize: 14 },
  userName: { fontFamily: fonts.displaySemi, color: colors.onSurface, fontSize: 22 },
  iconBtn: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  heroTitle: { fontFamily: fonts.displayBold, color: colors.onSurface, fontSize: 34, letterSpacing: 0.5 },
  loader: { paddingVertical: spacing.xxxl },
  body: { paddingHorizontal: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.sm },
  metricCard: { width: "47.6%", flexGrow: 1, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  metricValue: { fontFamily: fonts.displayBold, fontSize: 34, color: colors.onSurface, marginTop: spacing.sm },
  metricLabel: { fontFamily: fonts.textMedium, fontSize: 12, color: colors.onSurfaceSecondary, textTransform: "uppercase", letterSpacing: 0.8 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.onSurface },
  countPill: { marginLeft: spacing.sm, backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  countPillText: { fontFamily: fonts.displaySemi, color: colors.brand, fontSize: 13 },
  alertCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  alertName: { fontFamily: fonts.textSemi, color: colors.onSurface, fontSize: 15 },
  alertReason: { fontFamily: fonts.text, color: colors.warning, fontSize: 12, marginTop: 2 },
  moveRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm },
  moveIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  moveName: { fontFamily: fonts.textSemi, color: colors.onSurface, fontSize: 14 },
  moveSub: { fontFamily: fonts.text, color: colors.onSurfaceSecondary, fontSize: 12, marginTop: 1 },
  muted: { fontFamily: fonts.text, color: colors.onSurfaceTertiary, fontSize: 14, paddingVertical: spacing.sm },
  errorCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginTop: spacing.lg },
  errorTitle: { fontFamily: fonts.displaySemi, color: colors.onSurface, fontSize: 18, marginTop: spacing.sm },
  errorText: { fontFamily: fonts.text, color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 19, marginTop: spacing.xs, marginBottom: spacing.md },
});
