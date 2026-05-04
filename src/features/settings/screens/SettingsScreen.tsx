import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";

import { loadAppSettingsAsync } from "@/features/settings/services/settings.service";
import { SectionHeader } from "@/shared/components";
import { ConfirmDialog, ListItem, Screen } from "@/shared/ui";
import { useAppStore } from "@/store/app.store";
import { colors, spacing, typography } from "@/theme";
import { ChevronRight, Download, Upload } from "lucide-react-native";

import {
  BackupUserError,
  exportBackupAsync,
  getLastBackupExportedAtAsync,
  pickAndValidateBackupAsync,
  restoreBackupAsync,
} from "../services/backup.service";
import type { DulceFlowBackup } from "../types/backup";

function formatBackupDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString("es-CU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SettingsScreen() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<DulceFlowBackup | null>(null);
  const [lastBackupExportedAt, setLastBackupExportedAt] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const setBootstrapReady = useAppStore((state) => state.setBootstrapReady);

  useEffect(() => {
    let isMounted = true;

    async function loadLastBackupAsync() {
      try {
        const exportedAt = await getLastBackupExportedAtAsync();
        if (isMounted) {
          setLastBackupExportedAt(exportedAt);
        }
      } catch {
        if (isMounted) {
          setLastBackupExportedAt(null);
        }
      }
    }

    void loadLastBackupAsync();

    return () => {
      isMounted = false;
    };
  }, []);

  function getFriendlyError(error: unknown): string {
    if (error instanceof BackupUserError) {
      return error.message;
    }

    return "No se pudo completar la accion. Intenta de nuevo.";
  }

  async function handleExportBackup() {
    if (isExporting || isImporting) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsExporting(true);

    try {
      const result = await exportBackupAsync();
      setLastBackupExportedAt(result.exportedAt);
      setSuccessMessage("Copia de seguridad exportada correctamente.");
    } catch (error) {
      setErrorMessage(getFriendlyError(error));
    } finally {
      setIsExporting(false);
    }
  }

  async function handlePickBackup() {
    if (isExporting || isImporting) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsImporting(true);

    try {
      const backup = await pickAndValidateBackupAsync();
      if (backup) {
        setPendingBackup(backup);
      }
    } catch (error) {
      setErrorMessage(getFriendlyError(error));
    } finally {
      setIsImporting(false);
    }
  }

  async function handleRestoreBackup() {
    if (!pendingBackup || isImporting) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsImporting(true);

    try {
      await restoreBackupAsync(pendingBackup);
      const settings = await loadAppSettingsAsync();
      setBootstrapReady(settings.businessSettings, settings.accessibilitySettings);
      setPendingBackup(null);
      setSuccessMessage("Copia de seguridad restaurada correctamente.");
    } catch (error) {
      setErrorMessage(getFriendlyError(error));
    } finally {
      setIsImporting(false);
    }
  }

  const formattedLastBackup = formatBackupDate(lastBackupExportedAt);

  return (
    <Screen title="Ajustes">
      <ListItem
        onPress={() => router.push("/onboarding")}
        title="Configuracion inicial"
        subtitle="Nombre del negocio y avatar"
        trailing={<ChevronRight size={24} strokeWidth={2.4} color={colors.text} />}
      />
      <ListItem
        onPress={() => router.push("/products")}
        title="Productos"
        subtitle="Catalogo de articulos que vendes en pedidos"
        trailing={<ChevronRight size={24} strokeWidth={2.4} color={colors.text} />}
      />
      <ListItem
        onPress={() => router.push("/supplies")}
        title="Insumos"
        subtitle="Materiales o compras que usas para registrar gastos"
        trailing={<ChevronRight size={24} strokeWidth={2.4} color={colors.text} />}
      />
      <ListItem
        onPress={() => router.push("/accessibility")}
        title="Accesibilidad"
        subtitle="Legibilidad"
        trailing={<ChevronRight size={24} strokeWidth={2.4} color={colors.text} />}
      />
      <SectionHeader
        title="Datos y seguridad"
        subtitle="Guarda una copia de tus datos fuera de la app para evitar perderlos si cambias de telefono o reinstalas la aplicacion."
      />
      <ListItem
        onPress={handleExportBackup}
        title="Exportar copia de seguridad"
        subtitle={formattedLastBackup ? `Ultima copia: ${formattedLastBackup}` : "Crear archivo JSON para guardar fuera de la app"}
        trailing={
          isExporting ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Download size={24} strokeWidth={2.4} color={colors.text} />
          )
        }
      />
      <ListItem
        onPress={handlePickBackup}
        title="Importar copia de seguridad"
        subtitle="Restaurar datos desde un archivo JSON de DulceFlow"
        trailing={
          isImporting && !pendingBackup ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Upload size={24} strokeWidth={2.4} color={colors.text} />
          )
        }
      />
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <ConfirmDialog
        cancelLabel="Cancelar"
        confirmLabel="Restaurar"
        confirmVariant="solid"
        description="Esta accion puede reemplazar los datos actuales de la app. Te recomendamos exportar una copia antes de continuar."
        isLoading={isImporting}
        onCancel={() => {
          if (!isImporting) {
            setPendingBackup(null);
          }
        }}
        onConfirm={handleRestoreBackup}
        title="Restaurar copia de seguridad"
        visible={pendingBackup !== null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: colors.danger,
    marginTop: -spacing.sm,
    ...typography.caption,
  },
  successText: {
    color: colors.success,
    marginTop: -spacing.sm,
    ...typography.caption,
  },
});
