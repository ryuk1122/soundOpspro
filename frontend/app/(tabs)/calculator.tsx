import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/lib/api";
import { Button, Chip, TextField } from "@/src/components/ui";
import { colors, fonts, radius, spacing } from "@/src/lib/theme";

type Tool = "spl" | "impedance" | "amp";
const TOOLS: { key: Tool; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "spl", label: "SPL Loss", icon: "volume-high" },
  { key: "impedance", label: "Impedance", icon: "git-merge" },
  { key: "amp", label: "Amp Power", icon: "flash" },
];

export default function Calculator() {
  const insets = useSafeAreaInsets();
  const [tool, setTool] = useState<Tool>("spl");
  const [splRef, setSplRef] = useState("130");
  const [distRef, setDistRef] = useState("1");
  const [distTarget, setDistTarget] = useState("10");
  const [imp, setImp] = useState("8");
  const [count, setCount] = useState("2");
  const [mode, setMode] = useState<"series" | "parallel">("parallel");
  const [spkPower, setSpkPower] = useState("500");
  const [headroom, setHeadroom] = useState("3");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchTool = (t: Tool) => { setTool(t); setResult(null); setError(""); };

  const calculate = async () => {
    setError(""); setResult(null); setLoading(true);
    try {
      if (tool === "spl") {
        const r = await api("/calc/spl", { method: "POST", body: { spl_ref: Number(splRef), dist_ref: Number(distRef), dist_target: Number(distTarget) } });
        setResult({ big: `${r.spl_target} dB`, small: `−${r.loss_db} dB loss`, note: r.note });
      } else if (tool === "impedance") {
        const r = await api("/calc/impedance", { method: "POST", body: { impedance: Number(imp), count: Number(count), mode } });
        setResult({ big: `${r.total_impedance} Ω`, small: `${count} units · ${mode}`, note: r.warning, warn: !!r.warning });
      } else {
        const r = await api("/calc/amp-power", { method: "POST", body: { speaker_power: Number(spkPower), headroom_db: Number(headroom) } });
        setResult({ big: `${r.recommended_power} W`, small: `${r.range_min}–${r.range_max} W range`, note: r.note });
      }
    } catch (e: any) { setError(e.message || "Calculation failed"); } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Acoustic Tools</Text>
        <Text style={styles.sub}>Computed server-side for precision.</Text>
        <View style={styles.toolRow}>
          {TOOLS.map((t) => (<Chip key={t.key} testID={`tool-${t.key}`} label={t.label} active={tool === t.key} onPress={() => switchTool(t.key)} />))}
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {tool === "spl" && (<>
            <TextField testID="spl-ref-input" label="SPL @ reference (dB)" value={splRef} onChangeText={setSplRef} keyboardType="numeric" />
            <TextField testID="dist-ref-input" label="Reference distance (m)" value={distRef} onChangeText={setDistRef} keyboardType="numeric" />
            <TextField testID="dist-target-input" label="Target distance (m)" value={distTarget} onChangeText={setDistTarget} keyboardType="numeric" />
          </>)}
          {tool === "impedance" && (<>
            <TextField testID="imp-input" label="Impedance per speaker (Ω)" value={imp} onChangeText={setImp} keyboardType="numeric" />
            <TextField testID="count-input" label="Number of speakers" value={count} onChangeText={setCount} keyboardType="numeric" />
            <Text style={styles.fieldLabel}>Wiring</Text>
            <View style={styles.modeRow}>
              <Chip testID="mode-parallel" label="Parallel" active={mode === "parallel"} onPress={() => setMode("parallel")} />
              <Chip testID="mode-series" label="Series" active={mode === "series"} onPress={() => setMode("series")} />
            </View>
          </>)}
          {tool === "amp" && (<>
            <TextField testID="spk-power-input" label="Speaker continuous power (W)" value={spkPower} onChangeText={setSpkPower} keyboardType="numeric" />
            <TextField testID="headroom-input" label="Headroom (dB)" value={headroom} onChangeText={setHeadroom} keyboardType="numeric" />
          </>)}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button testID="calculate-button" title="Calculate" icon="calculator-outline" onPress={calculate} loading={loading} />

          {result && (
            <View testID="calc-result" style={[styles.resultBox, result.warn && { borderColor: colors.warning }]}>
              <Text style={styles.resultLabel}>RESULT</Text>
              <Text style={styles.resultBig}>{result.big}</Text>
              <Text style={styles.resultSmall}>{result.small}</Text>
              {result.note ? <Text style={[styles.resultNote, result.warn && { color: colors.warning }]}>{result.note}</Text> : null}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  title: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.onSurface },
  sub: { fontFamily: fonts.text, fontSize: 13, color: colors.onSurfaceSecondary, marginBottom: spacing.md },
  toolRow: { flexDirection: "row", gap: spacing.sm },
  form: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  fieldLabel: { fontFamily: fonts.textMedium, color: colors.onSurfaceSecondary, fontSize: 12, marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 1 },
  modeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  error: { color: colors.error, fontFamily: fonts.textMedium, fontSize: 13, marginBottom: spacing.md },
  resultBox: { marginTop: spacing.xl, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.brand, padding: spacing.xl, alignItems: "center" },
  resultLabel: { fontFamily: fonts.textMedium, fontSize: 12, color: colors.brand, letterSpacing: 2 },
  resultBig: { fontFamily: fonts.displayBold, fontSize: 56, color: colors.onSurface, marginVertical: spacing.xs },
  resultSmall: { fontFamily: fonts.displayMedium, fontSize: 18, color: colors.onSurfaceSecondary },
  resultNote: { fontFamily: fonts.text, fontSize: 13, color: colors.onSurfaceTertiary, textAlign: "center", marginTop: spacing.md },
});
