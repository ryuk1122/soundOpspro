import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Linking } from "react-native";

import { API_BASE, getToken } from "@/src/lib/api";

type ExportKind = "xlsx" | "pdf";

const EXPORTS: Record<ExportKind, { path: string; filename: string; mimeType: string; title: string }> = {
  xlsx: {
    path: "/exports/report.xlsx",
    filename: "soundops-reporte.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    title: "Guardar Excel de SoundOps",
  },
  pdf: {
    path: "/exports/report.pdf",
    filename: "soundops-reporte.pdf",
    mimeType: "application/pdf",
    title: "Guardar PDF de SoundOps",
  },
};

export async function downloadReport(kind: ExportKind): Promise<void> {
  const config = EXPORTS[kind];
  const token = await getToken();
  if (!token) throw new Error("Inicia sesion de nuevo para exportar archivos.");

  const directory = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  if (!directory) throw new Error("No se encontro almacenamiento disponible en este dispositivo.");

  const fileUri = `${directory}${Date.now()}-${config.filename}`;
  const result = await FileSystem.downloadAsync(`${API_BASE}${config.path}`, fileUri, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error("No se pudo generar el archivo. Intenta de nuevo.");
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(result.uri, {
      mimeType: config.mimeType,
      dialogTitle: config.title,
    });
    return;
  }

  await Linking.openURL(result.uri);
}
