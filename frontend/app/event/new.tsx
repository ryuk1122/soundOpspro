import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/lib/api";
import { Button, TextField } from "@/src/components/ui";
import { colors, fonts, spacing } from "@/src/lib/theme";

export default function EventForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (loading) return;
    setError("");
    if (!name.trim()) { setError("El nombre del evento es obligatorio"); return; }
    setLoading(true);
    try {
      await api("/events", { method: "POST", body: { name: name.trim(), venue: venue.trim(), date: date.trim(), notes: notes.trim() }, timeoutMs: 45000 });
      router.back();
    } catch (e: any) { setError(e.message || "No se pudo crear el evento"); } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="close-event-form" onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Nuevo evento</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TextField testID="event-name-input" label="Nombre del evento" value={name} onChangeText={setName} placeholder="Ej. Festival de verano" />
          <TextField testID="event-venue-input" label="Lugar" value={venue} onChangeText={setVenue} placeholder="Ej. Escenario principal" />
          <TextField testID="event-date-input" label="Fecha" value={date} onChangeText={setDate} placeholder="Ej. 2026-07-15" />
          <TextField testID="event-notes-input" label="Notas" value={notes} onChangeText={setNotes} placeholder="Personal, hora de llamada, requerimientos..." multiline style={styles.notes} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button testID="save-event-button" title="Crear evento" icon="checkmark" onPress={save} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  closeBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.onSurface },
  form: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  notes: { height: 96, paddingTop: spacing.md, textAlignVertical: "top" },
  error: { color: colors.error, fontFamily: fonts.textMedium, fontSize: 13, marginBottom: spacing.md },
});
