import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { getDatabaseAsync } from "@/database/connection";
import { BackupRepository, SettingsRepository } from "@/database/repositories";
import { DATABASE_VERSION } from "@/database/schema";
import type { DulceFlowBackup, DulceFlowBackupData } from "@/features/settings/types/backup";

const BACKUP_APP_NAME = "DulceFlow";
const BACKUP_VERSION = 1;
const LAST_BACKUP_EXPORTED_AT_KEY = "last_backup_exported_at";

export class BackupUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackupUserError";
  }
}

type BackupFileNamePrefix = "dulceflow-backup" | "dulceflow-pre-import-backup";

function ensureNativeBackupSupport(): void {
  if (Platform.OS === "web") {
    throw new BackupUserError("Las copias de seguridad con archivos estan disponibles en Android e iOS.");
  }
}

function createBackupFileName(prefix: BackupFileNamePrefix, date = new Date()): string {
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  const time = [date.getHours(), date.getMinutes()].map((value) => String(value).padStart(2, "0")).join("-");

  return `${prefix}-${stamp}-${time}.json`;
}

function getBackupDirectory(): string {
  if (!FileSystem.documentDirectory) {
    throw new BackupUserError("No se pudo acceder al almacenamiento local para crear la copia.");
  }

  return FileSystem.documentDirectory;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function validateStringField(row: Record<string, unknown>, key: string): boolean {
  return isString(row[key]) && row[key].trim().length > 0;
}

function validateNumberField(row: Record<string, unknown>, key: string): boolean {
  return isNumber(row[key]);
}

function validateNullableStringField(row: Record<string, unknown>, key: string): boolean {
  return isNullableString(row[key]);
}

function isProductRow(row: unknown): boolean {
  return (
    isPlainObject(row) &&
    validateStringField(row, "id") &&
    validateStringField(row, "name") &&
    validateNumberField(row, "price") &&
    validateNullableStringField(row, "description") &&
    validateNullableStringField(row, "image_uri") &&
    validateNumberField(row, "is_active") &&
    validateStringField(row, "created_at") &&
    validateStringField(row, "updated_at")
  );
}

function isSupplyRow(row: unknown): boolean {
  return (
    isPlainObject(row) &&
    validateStringField(row, "id") &&
    validateStringField(row, "name") &&
    validateStringField(row, "unit") &&
    validateNumberField(row, "default_price") &&
    validateNumberField(row, "is_active") &&
    validateStringField(row, "created_at") &&
    validateStringField(row, "updated_at")
  );
}

function isOrderRow(row: unknown): boolean {
  return (
    isPlainObject(row) &&
    validateStringField(row, "id") &&
    validateStringField(row, "order_number") &&
    validateNullableStringField(row, "customer_name") &&
    validateNullableStringField(row, "customer_phone") &&
    validateNumberField(row, "subtotal") &&
    validateNumberField(row, "total") &&
    validateStringField(row, "status") &&
    validateStringField(row, "due_date") &&
    validateNullableStringField(row, "note") &&
    validateNullableStringField(row, "delivered_at") &&
    validateNullableStringField(row, "cancelled_at") &&
    validateStringField(row, "created_at") &&
    validateStringField(row, "updated_at")
  );
}

function isOrderItemRow(row: unknown): boolean {
  return (
    isPlainObject(row) &&
    validateStringField(row, "id") &&
    validateStringField(row, "order_id") &&
    validateNullableStringField(row, "product_id") &&
    validateStringField(row, "product_name") &&
    validateNumberField(row, "quantity") &&
    validateNumberField(row, "unit_price") &&
    validateNumberField(row, "subtotal") &&
    validateStringField(row, "created_at")
  );
}

function isExpenseRow(row: unknown): boolean {
  return (
    isPlainObject(row) &&
    validateStringField(row, "id") &&
    validateStringField(row, "supply_id") &&
    validateStringField(row, "supply_name") &&
    validateNumberField(row, "quantity") &&
    validateStringField(row, "unit") &&
    validateNumberField(row, "unit_price") &&
    validateNumberField(row, "total") &&
    validateStringField(row, "status") &&
    validateNullableStringField(row, "note") &&
    validateStringField(row, "created_at") &&
    validateStringField(row, "updated_at")
  );
}

function isMovementRow(row: unknown): boolean {
  return (
    isPlainObject(row) &&
    validateStringField(row, "id") &&
    validateStringField(row, "type") &&
    validateStringField(row, "direction") &&
    validateStringField(row, "source_type") &&
    validateNullableStringField(row, "source_id") &&
    validateNumberField(row, "amount") &&
    validateStringField(row, "description") &&
    validateStringField(row, "status") &&
    validateStringField(row, "movement_date") &&
    validateStringField(row, "created_at") &&
    validateStringField(row, "updated_at") &&
    validateNullableStringField(row, "reversed_movement_id")
  );
}

function isSettingRow(row: unknown): boolean {
  return (
    isPlainObject(row) &&
    validateStringField(row, "key") &&
    isString(row.value) &&
    validateStringField(row, "updated_at")
  );
}

function validateCollection(
  data: Record<string, unknown>,
  key: keyof DulceFlowBackupData,
  validateRow: (row: unknown) => boolean
): void {
  const collection = data[key];

  if (!Array.isArray(collection)) {
    throw new BackupUserError("El archivo de copia no contiene todas las colecciones necesarias.");
  }

  if (!collection.every(validateRow)) {
    throw new BackupUserError("El archivo de copia contiene datos con un formato no compatible.");
  }
}

function validateReferences(data: DulceFlowBackupData): void {
  const orderIds = new Set(data.orders.map((order) => order.id));
  const supplyIds = new Set(data.supplies.map((supply) => supply.id));
  const movementIds = new Set(data.movements.map((movement) => movement.id));

  if (data.order_items.some((item) => !orderIds.has(item.order_id))) {
    throw new BackupUserError("La copia contiene articulos de pedidos sin pedido asociado.");
  }

  if (data.expenses.some((expense) => !supplyIds.has(expense.supply_id))) {
    throw new BackupUserError("La copia contiene gastos sin insumo asociado.");
  }

  if (
    data.movements.some(
      (movement) => movement.reversed_movement_id && !movementIds.has(movement.reversed_movement_id)
    )
  ) {
    throw new BackupUserError("La copia contiene movimientos con referencias incompletas.");
  }
}

export function validateBackup(value: unknown): DulceFlowBackup {
  if (!isPlainObject(value)) {
    throw new BackupUserError("El archivo seleccionado no es una copia valida de DulceFlow.");
  }

  if (value.app !== BACKUP_APP_NAME) {
    throw new BackupUserError("El archivo seleccionado no pertenece a DulceFlow.");
  }

  if (value.backup_version !== BACKUP_VERSION) {
    throw new BackupUserError("La version de esta copia no es compatible con esta app.");
  }

  if (!isString(value.exported_at) || value.exported_at.trim().length === 0) {
    throw new BackupUserError("La copia no incluye la fecha de exportacion.");
  }

  if (!isNumber(value.database_version)) {
    throw new BackupUserError("La copia no incluye una version de base de datos valida.");
  }

  if (!isPlainObject(value.data)) {
    throw new BackupUserError("La copia no incluye datos para restaurar.");
  }

  validateCollection(value.data, "products", isProductRow);
  validateCollection(value.data, "supplies", isSupplyRow);
  validateCollection(value.data, "orders", isOrderRow);
  validateCollection(value.data, "order_items", isOrderItemRow);
  validateCollection(value.data, "expenses", isExpenseRow);
  validateCollection(value.data, "movements", isMovementRow);
  validateCollection(value.data, "settings", isSettingRow);

  const backup = value as DulceFlowBackup;
  validateReferences(backup.data);

  return backup;
}

export function parseBackupJson(json: string): DulceFlowBackup {
  if (json.trim().length === 0) {
    throw new BackupUserError("El archivo seleccionado esta vacio.");
  }

  try {
    return validateBackup(JSON.parse(json));
  } catch (error) {
    if (error instanceof BackupUserError) {
      throw error;
    }

    throw new BackupUserError("El archivo seleccionado no tiene un JSON valido.");
  }
}

async function createBackupAsync(): Promise<DulceFlowBackup> {
  const database = await getDatabaseAsync();
  const data = await new BackupRepository(database).exportDataAsync();

  return {
    app: BACKUP_APP_NAME,
    backup_version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    database_version: DATABASE_VERSION,
    data,
  };
}

async function writeBackupFileAsync(backup: DulceFlowBackup, prefix: BackupFileNamePrefix): Promise<string> {
  const fileUri = `${getBackupDirectory()}${createBackupFileName(prefix)}`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backup, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return fileUri;
}

async function createPreImportBackupAsync(): Promise<void> {
  const backup = await createBackupAsync();
  await writeBackupFileAsync(backup, "dulceflow-pre-import-backup");
}

export async function exportBackupAsync(): Promise<{ exportedAt: string; fileUri: string }> {
  ensureNativeBackupSupport();

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new BackupUserError("Este dispositivo no permite compartir archivos desde la app.");
  }

  const backup = await createBackupAsync();
  const fileUri = await writeBackupFileAsync(backup, "dulceflow-backup");

  await Sharing.shareAsync(fileUri, {
    mimeType: "application/json",
    dialogTitle: "Guardar copia de seguridad",
    UTI: "public.json",
  });

  const database = await getDatabaseAsync();
  await new SettingsRepository(database).upsertAsync({
    key: LAST_BACKUP_EXPORTED_AT_KEY,
    value: backup.exported_at,
    updatedAt: backup.exported_at,
  });

  return { exportedAt: backup.exported_at, fileUri };
}

export async function pickAndValidateBackupAsync(): Promise<DulceFlowBackup | null> {
  ensureNativeBackupSupport();

  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: ["application/json", "text/json", "text/plain"],
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) {
    throw new BackupUserError("No se pudo leer el archivo seleccionado.");
  }

  if (asset.name && !asset.name.toLowerCase().endsWith(".json")) {
    throw new BackupUserError("Selecciona un archivo JSON de copia de seguridad.");
  }

  const content = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return parseBackupJson(content);
}

export async function restoreBackupAsync(backup: DulceFlowBackup): Promise<void> {
  const validatedBackup = validateBackup(backup);

  try {
    await createPreImportBackupAsync();
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to create pre-import backup", error);
    }

    throw new BackupUserError("No se pudo crear una copia automatica antes de restaurar.");
  }

  const database = await getDatabaseAsync();
  await new BackupRepository(database).replaceAllDataAsync(validatedBackup.data);
}

export async function getLastBackupExportedAtAsync(): Promise<string | null> {
  const database = await getDatabaseAsync();
  const row = await new SettingsRepository(database).getByKeyAsync(LAST_BACKUP_EXPORTED_AT_KEY);
  return row?.value ?? null;
}
