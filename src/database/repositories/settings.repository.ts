import type { DatabaseClient } from "@/database/client";
import type { AccessibilitySettings, BusinessSettings, Setting } from "@/shared/types";

type SettingRow = {
  key: string;
  value: string;
  updated_at: string;
};

const BUSINESS_NAME_KEY = "business_name";
const CURRENCY_KEY = "currency";
const FIXED_CURRENCY = "CUP";
const AVATAR_ID_KEY = "avatar_id";
const PHONE_KEY = "phone";
const ADDRESS_KEY = "address";
const FONT_SCALE_KEY = "font_scale";

function mapSettingRow(row: SettingRow): Setting {
  return {
    key: row.key,
    value: row.value,
    updatedAt: row.updated_at,
  };
}

export class SettingsRepository {
  constructor(private readonly client: DatabaseClient) {}

  async getByKeyAsync(key: string): Promise<Setting | null> {
    const row = await this.client.getFirstAsync<SettingRow>("SELECT * FROM settings WHERE key = ? LIMIT 1;", [key]);
    return row ? mapSettingRow(row) : null;
  }

  async getManyAsync(keys: string[]): Promise<Setting[]> {
    if (keys.length === 0) {
      return [];
    }

    const placeholders = keys.map(() => "?").join(", ");
    const rows = await this.client.getAllAsync<SettingRow>(
      `SELECT * FROM settings WHERE key IN (${placeholders}) ORDER BY key ASC;`,
      keys
    );
    return rows.map(mapSettingRow);
  }

  async upsertAsync(setting: Setting): Promise<void> {
    await this.client.runAsync(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at;`,
      [setting.key, setting.value, setting.updatedAt]
    );
  }

  async saveBusinessSettingsAsync(settings: BusinessSettings, updatedAt: string): Promise<void> {
    const entries: Setting[] = [
      { key: BUSINESS_NAME_KEY, value: settings.businessName, updatedAt },
      { key: CURRENCY_KEY, value: FIXED_CURRENCY, updatedAt },
    ];

    if (settings.phone !== undefined) {
      entries.push({ key: PHONE_KEY, value: settings.phone, updatedAt });
    }

    if (settings.avatarId !== undefined) {
      entries.push({ key: AVATAR_ID_KEY, value: settings.avatarId, updatedAt });
    }

    if (settings.address !== undefined) {
      entries.push({ key: ADDRESS_KEY, value: settings.address, updatedAt });
    }

    await this.client.withTransactionAsync(async () => {
      for (const entry of entries) {
        await this.upsertAsync(entry);
      }
    });
  }

  async getBusinessSettingsAsync(): Promise<BusinessSettings | null> {
    const rows = await this.getManyAsync([BUSINESS_NAME_KEY, CURRENCY_KEY, AVATAR_ID_KEY, PHONE_KEY, ADDRESS_KEY]);
    const map = new Map(rows.map((row) => [row.key, row.value]));

    const businessName = map.get(BUSINESS_NAME_KEY);

    if (!businessName) {
      return null;
    }

    return {
      businessName,
      currency: FIXED_CURRENCY,
      avatarId: map.get(AVATAR_ID_KEY),
      phone: map.get(PHONE_KEY),
      address: map.get(ADDRESS_KEY),
    };
  }

  async saveAccessibilitySettingsAsync(settings: AccessibilitySettings, updatedAt: string): Promise<void> {
    await this.client.withTransactionAsync(async () => {
      await this.upsertAsync({ key: FONT_SCALE_KEY, value: String(settings.fontScale), updatedAt });
    });
  }

  async getAccessibilitySettingsAsync(): Promise<AccessibilitySettings | null> {
    const rows = await this.getManyAsync([FONT_SCALE_KEY]);
    const map = new Map(rows.map((row) => [row.key, row.value]));
    const fontScale = Number(map.get(FONT_SCALE_KEY));

    if (!Number.isFinite(fontScale)) {
      return null;
    }

    return {
      fontScale,
    };
  }
}
