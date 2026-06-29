import { useCallback, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/lib/api";
import { Badge, Button } from "@/src/components/ui";
import { CONDITIONS, colors, fonts, radius, spacing } from "@/src/lib/theme";

export default function EquipmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await api<any>(`/equipment/${id}`, { timeoutMs: 45000 });
      setItem(data);
    } catch (e: any) {
      setError(e?.message || "Equipment could not load.");
    } finally {
      setLoading(false);
    }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async () => {
    setDeleting(true);
    try { await api(`/equipment/${id}`, { method: "DELETE" }); router.back(); }
    catch (e: any) { setError(e?.message || "Could not delete equipment."); setDeleting(false); setConfirm(false); }
  };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator color={colors.brand} size="large" /></View>;
  }

  if (!item) {
    return (
      <View style={[styles.loader, { paddingHorizontal: spacing.lg }]}>
        <Text style={styles.errorTitle}>Equipment unavailable</Text>
        <Text style={styles.errorText}>{error || "Could not load this equipment."}</Text>
        <Button title="Retry" icon="refresh" variant="secondary" onPress={() => { setLoading(true); load(); }} />
      </View>
    );
  }

  const cond = CONDITIONS.find((c) => c.key === item.condition) ?? CONDITIONS[0];
  const deployed = item.quantity - item.quantity_available;
  const specs = [
    { label: "Total Units", value: item.quantity },
    { label: "Available", value: item.quantity_available },
    { label: "Deployed", value: deployed },
    { label: "Category", value: item.category },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.hero}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.heroPlaceholder]}>
              <Ionicons name="musical-notes" size={56} color={colors.onSurfaceTertiary} />
            </View>
          )}
          <LinearGradient colors={["rgba(15,17,21,0.55)", "transparent", colors.surface]} style={StyleSheet.absoluteFill} />
          <Pressable testID="back-button" onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + spacing.sm }]}>
            <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.brand}>{item.brand || item.category}</Text>
          <Text style={styles.name}>{item.name}</Text>
          {error ? <Text style={styles.inlineError}>{error}</Text> : null}
          <View style={{ flexDirection: "row", marginTop: spacing.sm }}><Badge label={cond.label} color={cond.color} /></View>

          <View style={styles.specGrid}>
            {specs.map((s) => (
              <View key={s.label} style={styles.specCard}>
                <Text style={styles.specValue}>{s.value}</Text>
                <Text style={styles.specLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {item.notes ? (<>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{item.notes}</Text>
          </>) : null}
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Button testID="edit-button" title="Edit" icon="create-outline" variant="secondary" style={{ flex: 1 }} onPress={() => router.push(`/equipment/new?id=${id}`)} />
        <Button testID="delete-button" title="Delete" icon="trash-outline" variant="danger" style={{ flex: 1 }} onPress={() => setConfirm(true)} />
      </View>

      <Modal visible={confirm} transparent animationType="fade" onRequestClose={() => setConfirm(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete this gear?</Text>
            <Text style={styles.modalText}>{item.name} will be permanently removed from inventory.</Text>
            <View style={styles.modalActions}>
              <Button testID="cancel-delete" title="Cancel" variant="ghost" style={{ flex: 1 }} onPress={() => setConfirm(false)} />
              <Button testID="confirm-delete" title="Delete" variant="danger" style={{ flex: 1 }} loading={deleting} onPress={remove} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loader: { flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  hero: { height: 300, backgroundColor: colors.surfaceSecondary },
  heroPlaceholder: { alignItems: "center", justifyContent: "center" },
  backBtn: { position: "absolute", left: spacing.lg, width: 40, height: 40, borderRadius: radius.md, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: spacing.lg, marginTop: -spacing.xl },
  brand: { fontFamily: fonts.textMedium, fontSize: 14, color: colors.brand, textTransform: "uppercase", letterSpacing: 1 },
  name: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.onSurface },
  specGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xl },
  specCard: { width: "47.6%", flexGrow: 1, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  specValue: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.onSurface },
  specLabel: { fontFamily: fonts.textMedium, fontSize: 12, color: colors.onSurfaceSecondary, textTransform: "uppercase", letterSpacing: 0.6 },
  sectionTitle: { fontFamily: fonts.displaySemi, fontSize: 18, color: colors.onSurface, marginTop: spacing.xl, marginBottom: spacing.sm },
  notes: { fontFamily: fonts.text, fontSize: 14, color: colors.onSurfaceSecondary, lineHeight: 21 },
  actions: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", paddingHorizontal: spacing.xl },
  modalCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  modalTitle: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.onSurface },
  modalText: { fontFamily: fonts.text, fontSize: 14, color: colors.onSurfaceSecondary, marginTop: spacing.sm, marginBottom: spacing.lg },
  modalActions: { flexDirection: "row", gap: spacing.md },
  errorTitle: { fontFamily: fonts.displaySemi, color: colors.onSurface, fontSize: 20, marginBottom: spacing.sm },
  errorText: { fontFamily: fonts.text, color: colors.onSurfaceSecondary, fontSize: 14, textAlign: "center", marginBottom: spacing.lg },
  inlineError: { fontFamily: fonts.textMedium, color: colors.error, fontSize: 13, marginTop: spacing.sm },
});
