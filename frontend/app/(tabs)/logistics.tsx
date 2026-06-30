import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/lib/api";
import { Badge, Button, EmptyState } from "@/src/components/ui";
import { colors, fonts, images, radius, spacing, STATUS_LABELS } from "@/src/lib/theme";

type EventT = { id: string; name: string; venue: string; date: string; status: string; assignments: { quantity: number; returned: number }[] };
const STATUS_COLOR: Record<string, string> = { scheduled: colors.warning, active: colors.brand, completed: colors.success };

export default function Logistics() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<EventT[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (forceRefresh = false) => {
    setError("");
    try {
      const data = await api<EventT[]>("/events", { forceRefresh, timeoutMs: 45000 });
      setEvents(data);
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar los eventos.");
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderItem = ({ item }: { item: EventT }) => {
    const total = item.assignments.reduce((s, a) => s + a.quantity, 0);
    const returned = item.assignments.reduce((s, a) => s + a.returned, 0);
    const pct = total === 0 ? 0 : Math.round((returned / total) * 100);
    return (
      <Pressable testID={`event-${item.id}`} onPress={() => router.push(`/event/${item.id}`)} style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color={colors.onSurfaceTertiary} />
              <Text style={styles.metaText} numberOfLines={1}>{item.venue || "Sin lugar"}</Text>
              {!!item.date && (<>
                <Ionicons name="calendar-outline" size={13} color={colors.onSurfaceTertiary} style={{ marginLeft: spacing.sm }} />
                <Text style={styles.metaText}>{item.date}</Text>
              </>)}
            </View>
          </View>
          <Badge label={STATUS_LABELS[item.status] ?? item.status} color={STATUS_COLOR[item.status] ?? colors.brand} />
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${pct}%` }]} /></View>
          <Text style={styles.progressLabel}>{returned}/{total} devueltos</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Image source={{ uri: images.logisticsBg }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient colors={["rgba(15,17,21,0.4)", "rgba(15,17,21,0.85)", colors.surface]} style={StyleSheet.absoluteFill} />
        <View style={[styles.heroContent, { paddingTop: insets.top + spacing.lg }]}>
          <Text style={styles.heroTitle}>Logistica</Text>
          <Text style={styles.heroSub}>Controla envios y devoluciones por evento.</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.brand} size="large" /></View>
      ) : (
        <FlatList
          data={events} keyExtractor={(e) => e.id} renderItem={renderItem}
          contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.brand} />}
          ListEmptyComponent={
            error ? (
              <View style={styles.errorState}>
                <EmptyState icon="cloud-offline-outline" title="Eventos no disponibles" subtitle={error} />
                <Button title="Reintentar" icon="refresh" variant="secondary" onPress={() => { setLoading(true); load(true); }} />
              </View>
            ) : (
              <EmptyState icon="calendar-outline" title="No hay eventos" subtitle="Crea un evento para asignar equipos y controlar devoluciones." />
            )
          }
        />
      )}

      <View style={[styles.cta, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Button testID="create-event-button" title="Crear evento" icon="add" onPress={() => router.push("/event/new")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: { height: 170 },
  heroContent: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: "flex-end", paddingBottom: spacing.lg },
  heroTitle: { fontFamily: fonts.displayBold, fontSize: 32, color: colors.onSurface },
  heroSub: { fontFamily: fonts.text, fontSize: 14, color: colors.onSurfaceSecondary },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 120 },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.sm },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  eventName: { fontFamily: fonts.displaySemi, fontSize: 18, color: colors.onSurface },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.xs },
  metaText: { fontFamily: fonts.text, fontSize: 12, color: colors.onSurfaceTertiary, marginLeft: 3 },
  progressRow: { marginTop: spacing.md },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.brand, borderRadius: 3 },
  progressLabel: { fontFamily: fonts.textMedium, fontSize: 12, color: colors.onSurfaceSecondary, marginTop: spacing.xs },
  cta: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider },
  errorState: { paddingHorizontal: spacing.lg },
});
