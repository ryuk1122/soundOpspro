import React from "react";
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput,
  TextInputProps, View, ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, fonts, radius, spacing } from "@/src/lib/theme";

/* ----------------------------- Button ----------------------------- */
export function Button({
  title, onPress, variant = "primary", loading = false, disabled = false, icon, testID, style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  testID?: string;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;
  const bg =
    variant === "primary" ? colors.brand
    : variant === "danger" ? colors.error
    : variant === "secondary" ? colors.surfaceTertiary
    : "transparent";
  const fg = variant === "primary" || variant === "danger" ? colors.onBrand : colors.onSurface;

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        if (isDisabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === "ghost" && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.btnRow}>
          {icon && <Ionicons name={icon} size={18} color={fg} style={{ marginRight: spacing.sm }} />}
          <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

/* ----------------------------- TextField ----------------------------- */
export function TextField({
  label, testID, ...props
}: { label?: string; testID?: string } & TextInputProps) {
  return (
    <View style={styles.fieldWrap}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TextInput
        testID={testID}
        placeholderTextColor={colors.onSurfaceTertiary}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

/* ----------------------------- Chip ----------------------------- */
export function Chip({
  label, active, onPress, testID,
}: { label: string; active: boolean; onPress: () => void; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.brand : colors.surfaceSecondary,
          borderColor: active ? colors.brand : colors.border,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? colors.onBrand : colors.onSurfaceSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ----------------------------- Badge ----------------------------- */
export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

/* ----------------------------- EmptyState ----------------------------- */
export function EmptyState({
  icon, title, subtitle,
}: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={36} color={colors.brand} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { height: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
  btnRow: { flexDirection: "row", alignItems: "center" },
  btnText: { fontFamily: fonts.textSemi, fontSize: 16, letterSpacing: 0.3 },
  fieldWrap: { marginBottom: spacing.lg },
  fieldLabel: { fontFamily: fonts.textMedium, color: colors.onSurfaceSecondary, fontSize: 12, marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 1 },
  input: { backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, height: 52, color: colors.onSurface, fontFamily: fonts.text, fontSize: 16 },
  chip: { height: 36, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  chipText: { fontFamily: fonts.textMedium, fontSize: 13 },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  badgeText: { fontFamily: fonts.textMedium, fontSize: 11 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxxl },
  emptyIcon: { width: 76, height: 76, borderRadius: radius.lg, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  emptyTitle: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.onSurface },
  emptySub: { fontFamily: fonts.text, fontSize: 14, color: colors.onSurfaceSecondary, marginTop: spacing.xs, textAlign: "center", paddingHorizontal: spacing.xl },
});
