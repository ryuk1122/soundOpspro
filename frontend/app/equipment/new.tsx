import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/lib/api";
import { Button, Chip, TextField } from "@/src/components/ui";
import { CATEGORIES, CATEGORY_LABELS, CONDITIONS, colors, fonts, radius, spacing } from "@/src/lib/theme";

export default function EquipmentForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState("operational");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [permissionBlocked, setPermissionBlocked] = useState(false);

  useEffect(() => {
    if (!editing) return;
    (async () => {
      try {
        // Item individual: no cacheamos (cacheMs default 0), siempre fresco.
        const item = await api<any>(`/equipment/${id}`);
        setName(item.name); setBrand(item.brand || ""); setCategory(item.category);
        setCondition(item.condition); setQuantity(String(item.quantity));
        setNotes(item.notes || ""); setImage(item.image || null);
      } catch (e: any) {
        // FIX Bug 1 (diagnostico previo): el catch ahora muestra el error
        // real al usuario en vez de tragarselo en silencio.
        setError(e?.message || "No se pudo cargar el equipo");
      }
    })();
  }, [editing, id]);

  const setPickedImage = (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets[0]?.base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const pickImage = async () => {
    setPermissionBlocked(false);
    const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    let status = perm.status;
    if (status !== "granted") {
      if (!perm.canAskAgain) { setPermissionBlocked(true); return; }
      const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
      status = req.status;
      if (status !== "granted") { if (!req.canAskAgain) setPermissionBlocked(true); return; }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
    });
    setPickedImage(result);
  };

  const takePhoto = async () => {
    setPermissionBlocked(false);
    const perm = await ImagePicker.getCameraPermissionsAsync();
    let status = perm.status;
    if (status !== "granted") {
      if (!perm.canAskAgain) { setPermissionBlocked(true); return; }
      const req = await ImagePicker.requestCameraPermissionsAsync();
      status = req.status;
      if (status !== "granted") { if (!req.canAskAgain) setPermissionBlocked(true); return; }
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.55, base64: true,
    });
    setPickedImage(result);
  };

  const save = async () => {
    if (loading) return;
    setError("");
    if (!name.trim()) { setError("El nombre del equipo es obligatorio"); return; }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) { setError("La cantidad debe ser al menos 1"); return; }
    setLoading(true);
    const body = { name: name.trim(), brand: brand.trim(), category, condition, quantity: qty, notes: notes.trim(), image };
    try {
      // Endpoint correcto: /equipment (no /events). api.ts invalida la cache
      // de "/equipment" automaticamente tras este POST/PUT.
      if (editing) await api(`/equipment/${id}`, { method: "PUT", body, timeoutMs: 90000 });
      else await api("/equipment", { method: "POST", body, timeoutMs: 90000 });
      router.back();
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="close-form" onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>{editing ? "Editar equipo" : "Agregar equipo"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable testID="pick-image" onPress={pickImage} style={styles.imagePicker}>
            {image ? (
              <Image source={{ uri: image }} style={styles.imagePreview} contentFit="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={28} color={colors.brand} />
                <Text style={styles.imageHint}>Agrega una foto</Text>
              </View>
            )}
          </Pressable>
          <View style={styles.photoActions}>
            <Button testID="take-photo" title="Camara" icon="camera-outline" variant="secondary" style={styles.photoButton} onPress={takePhoto} />
            <Button testID="pick-image-library" title="Galeria" icon="images-outline" variant="secondary" style={styles.photoButton} onPress={pickImage} />
          </View>
          {image ? (
            <Button testID="remove-photo" title="Quitar foto" icon="close-circle-outline" variant="ghost" onPress={() => setImage(null)} />
          ) : null}
          {permissionBlocked && (
            <View style={styles.permBox}>
              <Text style={styles.permText}>El permiso de fotos o camara esta bloqueado. Activalo en Ajustes para agregar imagenes.</Text>
              <Button testID="open-settings" title="Abrir ajustes" variant="secondary" onPress={() => Linking.openSettings()} />
            </View>
          )}

          <TextField testID="name-input" label="Nombre" value={name} onChangeText={setName} placeholder="Ej. QSC K12.2" />
          <TextField testID="brand-input" label="Marca" value={brand} onChangeText={setBrand} placeholder="Ej. QSC" />

          <Text style={styles.label}>Categoria</Text>
          <View style={styles.wrapRow}>
            {CATEGORIES.map((c) => (<Chip key={c} testID={`cat-${c}`} label={CATEGORY_LABELS[c] ?? c} active={category === c} onPress={() => setCategory(c)} />))}
          </View>

          <Text style={styles.label}>Estado</Text>
          <View style={styles.wrapRow}>
            {CONDITIONS.map((c) => (<Chip key={c.key} testID={`cond-${c.key}`} label={c.label} active={condition === c.key} onPress={() => setCondition(c.key)} />))}
          </View>

          <View style={{ height: spacing.lg }} />
          <TextField testID="quantity-input" label="Cantidad" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
          <TextField testID="notes-input" label="Notas" value={notes} onChangeText={setNotes} placeholder="Serie, accesorios, detalles del estado..." multiline style={styles.notes} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button testID="save-equipment-button" title={editing ? "Guardar cambios" : "Agregar al inventario"} icon="checkmark" onPress={save} loading={loading} />
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
  imagePicker: { height: 160, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", overflow: "hidden", marginBottom: spacing.lg },
  imagePreview: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  imageHint: { fontFamily: fonts.textMedium, color: colors.onSurfaceSecondary, fontSize: 13, marginTop: spacing.sm },
  photoActions: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  photoButton: { flex: 1 },
  permBox: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg, gap: spacing.sm },
  permText: { fontFamily: fonts.text, color: colors.onSurfaceSecondary, fontSize: 13 },
  label: { fontFamily: fonts.textMedium, color: colors.onSurfaceSecondary, fontSize: 12, marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 1 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  notes: { height: 96, paddingTop: spacing.md, textAlignVertical: "top" },
  error: { color: colors.error, fontFamily: fonts.textMedium, fontSize: 13, marginBottom: spacing.md },
});
