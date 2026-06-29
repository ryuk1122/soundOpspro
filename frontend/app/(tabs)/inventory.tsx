import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/lib/api";
import { Badge, Button, Chip, EmptyState } from "@/src/components/ui";
import { CATEGORIES, CONDITIONS, colors, fonts, radius, spacing } from "@/src/lib/theme";

type Item = {
  id: string; name: string; brand: string; category: string; condition: string;
  quantity: number; quantity_available: number; image: string | null;
};

const PAGE = 20;
const FILTERS = ["All", ...CATEGORIES];

export default function Inventory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Item[]>([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");

  const fetchPage = useCallback(async (cat: string, skip: number, replace: boolean, forceRefresh = false) => {
    const q = cat === "All" ? "" : `&category=${encodeURIComponent(cat)}`;
    const data = await api<Item[]>(`/equipment?skip=${skip}&limit=${PAGE}${q}`, { forceRefresh, timeoutMs: 45000 });
    setHasMore(data.length === PAGE);
    setItems((prev) => (replace ? data : [...prev, ...data]));
  }, []);

  const loadInitial = useCallback(async (cat: string, forceRefresh = false) => {
    setLoading(true);
    setError("");
    try {
      await fetchPage(cat, 0, true, forceRefresh);
    } catch (e: any) {
      setError(e?.message || "Inventory could not load.");
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchPage]);

  useFocusEffect(useCallback(() => { loadInitial(category); }, [category, loadInitial]));

  const loadMore = async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try { await fetchPage(category, items.length, false); } catch (e: any) { setError(e?.message || "Could not load more equipment."); } finally { setLoadingMore(false); }
  };

  const renderItem = ({ item }: { item: Item }) => {
    const cond = CONDITIONS.find((c) => c.key === item.condition) ?? CONDITIONS[0];
    const out = item.quantity_available === 0;
    return (
      <Pressable testID={`equipment-${item.id}`} onPress={() => router.push(`/equipment/${item.id}`)} style={styles.row}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="musical-notes" size={22} color={colors.onSurfaceTertiary} />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemBrand} numberOfLines={1}>{item.brand || item.category}</Text>
          <View style={styles.itemMeta}><Badge label={cond.label} color={cond.color} /></View>
        </View>
        <View style={styles.stockBox}>
          <Text style={[styles.stockNum, { color: out ? colors.error : colors.onSurface }]}>{item.quantity_available}</Text>
          <Text style={styles.stockLabel}>/ {item.quantity}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Inventory</Text>
        <FlatList
          data={FILTERS} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(c) => c}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item: cat }) => (
            <Chip testID={`category-${cat}`} label={cat} active={category === cat} onPress={() => setCategory(cat)} />
          )}
        />
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.brand} size="large" /></View>
      ) : (
        <FlatList
          data={items} keyExtractor={(i) => i.id} renderItem={renderItem}
          contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
          onEndReached={loadMore} onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadInitial(category, true); }} tintColor={colors.brand} />}
          ListEmptyComponent={
            error ? (
              <View style={styles.errorState}>
                <EmptyState icon="cloud-offline-outline" title="Inventory unavailable" subtitle={error} />
                <Button title="Retry" icon="refresh" variant="secondary" onPress={() => loadInitial(category, true)} />
              </View>
            ) : (
              <EmptyState icon="mic-outline" title="Inventory is empty" subtitle="Add your first piece of gear to start tracking stock and deployments." />
            )
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.brand} style={{ marginVertical: spacing.lg }} /> : null}
        />
      )}

      <View style={[styles.cta, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Button testID="add-equipment-button" title="Add Equipment" icon="add" onPress={() => router.push("/equipment/new")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider },
  title: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.onSurface, marginBottom: spacing.md },
  chipRow: { gap: spacing.sm, paddingRight: spacing.lg, paddingBottom: spacing.sm },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 120 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  itemName: { fontFamily: fonts.textSemi, fontSize: 16, color: colors.onSurface },
  itemBrand: { fontFamily: fonts.text, fontSize: 13, color: colors.onSurfaceSecondary, marginTop: 1 },
  itemMeta: { flexDirection: "row", marginTop: spacing.xs },
  stockBox: { alignItems: "center", marginLeft: spacing.sm },
  stockNum: { fontFamily: fonts.displayBold, fontSize: 24 },
  stockLabel: { fontFamily: fonts.text, fontSize: 11, color: colors.onSurfaceTertiary },
  cta: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider },
  errorState: { paddingHorizontal: spacing.lg },
});
