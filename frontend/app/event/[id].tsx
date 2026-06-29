import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { api } from "@/src/lib/api";
import { Badge, Button, EmptyState } from "@/src/components/ui";
import { colors, fonts, radius, spacing } from "@/src/lib/theme";

type Assignment = { equipment_id: string; equipment_name: string; quantity: number; returned: number };
type EventT = { id: string; name: string; venue: string; date: string; status: string; notes: string; assignments: Assignment[] };
type Item = { id: string; name: string; quantity_available: number; brand: string };
const STATUS_COLOR: Record<string, string> = { scheduled: colors.warning, active: colors.brand, completed: colors.success };

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable testID="stepper-minus" onPress={() => { Haptics.selectionAsync(); onChange(Math.max(min, value - 1)); }} style={styles.stepBtn}>
        <Ionicons name="remove" size={22} color={colors.onSurface} />
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable testID="stepper-plus" onPress={() => { Haptics.selectionAsync(); onChange(Math.min(max, value + 1)); }} style={styles.stepBtn}>
        <Ionicons name="add" size={22} color={colors.onSurface} />
      </Pressable>
    </View>
  );
}

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<EventT | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [available, setAvailable] = useState<Item[]>([]);
  const [picked, setPicked] = useState<Item | null>(null);
  const [assignQty, setAssignQty] = useState(1);
  const [returnTarget, setReturnTarget] = useState<Assignment | null>(null);
  const [returnQty, setReturnQty] = useState(1);

  const load = useCallback(async () => {
    try { const data = await api<EventT>(`/events/${id}`); setEvent(data); } catch {} finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openAssign = async () => {
    setPicked(null); setAssignQty(1);
    try { const items = await api<Item[]>("/equipment?limit=50"); setAvailable(items.filter((i) => i.quantity_available > 0)); }
    catch { setAvailable([]); }
    setAssignOpen(true);
  };

  const doAssign = async () => {
    if (!picked) return;
    setBusy(true);
    try { const updated = await api<EventT>(`/events/${id}/assign`, { method: "POST", body: { equipment_id: picked.id, quantity: assignQty } }); setEvent(updated); setAssignOpen(false); }
    catch {} finally { setBusy(false); }
  };

  const doReturn = async () => {
    if (!returnTarget) return;
    setBusy(true);
    try { const updated = await api<EventT>(`/events/${id}/return`, { method: "POST", body: { equipment_id: returnTarget.equipment_id, quantity: returnQty } }); setEvent(updated); setReturnTarget(null); }
    catch {} finally { setBusy(false); }
  };

  const setStatus = async (status: string) => {
    setBusy(true);
    try { const updated = await api<EventT>(`/events/${id}/status`, { method: "PATCH", body: { status } }); setEvent(updated); }
    catch {} finally { setBusy(false); }
  };

  if (loading || !event) {
    return <View style={styles.loader}><ActivityIndicator color={colors.brand} size="large" /></View>;
  }

  const total = event.assignments.reduce((s, a) => s + a.quantity, 0);
  const returned = event.assignments.reduce((s, a) => s + a.returned, 0);
  const pct = total === 0 ? 0 : Math.round((returned / total) * 100);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="back-event" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </Pressable>
        <Badge label={event.status} color={STATUS_COLOR[event.status] ?? colors.brand} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 160 }}>
        <Text style={styles.title}>{event.name}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={15} color={colors.onSurfaceTertiary} />
          <Text style={styles.metaText}>{event.venue || "No venue"}</Text>
          {!!event.date && (<>
            <Ionicons name="calendar-outline" size={15} color={colors.onSurfaceTertiary} style={{ marginLeft: spacing.md }} />
            <Text style={styles.metaText}>{event.date}</Text>
          </>)}
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressBig}>{pct}%</Text>
            <Text style={styles.progressInfo}>{returned} of {total} units returned</Text>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${pct}%` }]} /></View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Assigned Gear</Text>
          <Pressable testID="open-assign" onPress={openAssign} style={styles.addPill}>
            <Ionicons name="add" size={16} color={colors.onBrand} />
            <Text style={styles.addPillText}>Assign</Text>
          </Pressable>
        </View>

        {event.assignments.length === 0 ? (
          <EmptyState icon="cube-outline" title="No gear assigned" subtitle="Assign equipment from your inventory to this event." />
        ) : (
          event.assignments.map((a) => {
            const outstanding = a.quantity - a.returned;
            const done = outstanding === 0;
            return (
              <View key={a.equipment_id} style={styles.assignRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assignName}>{a.equipment_name}</Text>
                  <Text style={styles.assignSub}>{a.returned}/{a.quantity} returned · {outstanding} out</Text>
                </View>
                {done ? (
                  <View style={styles.doneTag}><Ionicons name="checkmark-circle" size={18} color={colors.success} /></View>
                ) : (
                  <Pressable testID={`return-${a.equipment_id}`} onPress={() => { setReturnTarget(a); setReturnQty(outstanding); }} style={styles.returnBtn}>
                    <Ionicons name="arrow-down" size={15} color={colors.brand} />
                    <Text style={styles.returnText}>Return</Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}

        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statusRow}>
          {["scheduled", "active", "completed"].map((s) => (
            <Pressable key={s} testID={`status-${s}`} onPress={() => setStatus(s)} style={[styles.statusChip, event.status === s && { backgroundColor: colors.brand, borderColor: colors.brand }]}>
              <Text style={[styles.statusChipText, event.status === s && { color: colors.onBrand }]}>{s}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal visible={assignOpen} transparent animationType="slide" onRequestClose={() => setAssignOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Assign Gear</Text>
            {available.length === 0 ? (
              <Text style={styles.muted}>No available units. Add stock or return deployed gear first.</Text>
            ) : (
              <FlatList
                data={available} keyExtractor={(i) => i.id} style={{ maxHeight: 240 }}
                renderItem={({ item }) => (
                  <Pressable testID={`pick-${item.id}`} onPress={() => { setPicked(item); setAssignQty(1); }}
                    style={[styles.pickRow, picked?.id === item.id && { borderColor: colors.brand, backgroundColor: colors.brandTertiary }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickName}>{item.name}</Text>
                      <Text style={styles.pickSub}>{item.brand || "—"} · {item.quantity_available} available</Text>
                    </View>
                    {picked?.id === item.id && <Ionicons name="checkmark-circle" size={20} color={colors.brand} />}
                  </Pressable>
                )}
              />
            )}
            {picked && (
              <View style={styles.qtyRow}>
                <Text style={styles.qtyLabel}>Quantity</Text>
                <Stepper value={assignQty} min={1} max={picked.quantity_available} onChange={setAssignQty} />
              </View>
            )}
            <View style={styles.sheetActions}>
              <Button testID="cancel-assign" title="Cancel" variant="ghost" style={{ flex: 1 }} onPress={() => setAssignOpen(false)} />
              <Button testID="confirm-assign" title="Assign" disabled={!picked} loading={busy} style={{ flex: 1 }} onPress={doAssign} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!returnTarget} transparent animationType="slide" onRequestClose={() => setReturnTarget(null)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Return {returnTarget?.equipment_name}</Text>
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Units to return</Text>
              <Stepper value={returnQty} min={1} max={returnTarget ? returnTarget.quantity - returnTarget.returned : 1} onChange={setReturnQty} />
            </View>
            <View style={styles.sheetActions}>
              <Button testID="cancel-return" title="Cancel" variant="ghost" style={{ flex: 1 }} onPress={() => setReturnTarget(null)} />
              <Button testID="confirm-return" title="Confirm Return" loading={busy} style={{ flex: 1 }} onPress={doReturn} />
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  iconBtn: { width: 40, height: 40, justifyContent: "center" },
  title: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.onSurface },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.xs },
  metaText: { fontFamily: fonts.text, fontSize: 13, color: colors.onSurfaceTertiary, marginLeft: 4 },
  progressCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginTop: spacing.lg },
  progressTop: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: spacing.md },
  progressBig: { fontFamily: fonts.displayBold, fontSize: 36, color: colors.brand },
  progressInfo: { fontFamily: fonts.textMedium, fontSize: 13, color: colors.onSurfaceSecondary },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.brand, borderRadius: 4 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.onSurface, marginTop: spacing.xl, marginBottom: spacing.md },
  addPill: { flexDirection: "row", alignItems: "center", backgroundColor: colors.brand, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, marginTop: spacing.xl },
  addPillText: { fontFamily: fonts.textSemi, color: colors.onBrand, fontSize: 13, marginLeft: 3 },
  assignRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  assignName: { fontFamily: fonts.textSemi, fontSize: 15, color: colors.onSurface },
  assignSub: { fontFamily: fonts.text, fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 },
  returnBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.brand, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  returnText: { fontFamily: fonts.textSemi, color: colors.brand, fontSize: 13, marginLeft: 3 },
  doneTag: { paddingHorizontal: spacing.sm },
  statusRow: { flexDirection: "row", gap: spacing.sm },
  statusChip: { flex: 1, alignItems: "center", paddingVertical: spacing.md, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
  statusChipText: { fontFamily: fonts.textMedium, fontSize: 13, color: colors.onSurfaceSecondary, textTransform: "capitalize" },
  muted: { fontFamily: fonts.text, color: colors.onSurfaceTertiary, fontSize: 14, paddingVertical: spacing.md },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, borderTopWidth: 1, borderColor: colors.border },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: "center", marginBottom: spacing.lg },
  sheetTitle: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.onSurface, marginBottom: spacing.md },
  pickRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  pickName: { fontFamily: fonts.textSemi, fontSize: 15, color: colors.onSurface },
  pickSub: { fontFamily: fonts.text, fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md, marginBottom: spacing.lg },
  qtyLabel: { fontFamily: fonts.textMedium, fontSize: 14, color: colors.onSurfaceSecondary },
  stepper: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  stepBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  stepValue: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.onSurface, minWidth: 36, textAlign: "center" },
  sheetActions: { flexDirection: "row", gap: spacing.md },
});
