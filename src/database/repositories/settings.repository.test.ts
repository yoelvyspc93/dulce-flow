import { migrateDatabaseAsync } from "@/database/migrations";
import { SettingsRepository } from "@/database/repositories";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";

describe("SettingsRepository", () => {
  it("returns null for missing keys and no rows for empty key lists", async () => {
    const repository = new SettingsRepository(createMockDatabaseClient().client);

    await expect(repository.getByKeyAsync("missing")).resolves.toBeNull();
    await expect(repository.getManyAsync([])).resolves.toEqual([]);
  });

  it("upserts settings and reads them by key", async () => {
    const repository = new SettingsRepository(createMockDatabaseClient().client);

    await repository.upsertAsync({ key: "currency", value: "USD", updatedAt: "2026-04-27T10:00:00.000Z" });
    await repository.upsertAsync({ key: "currency", value: "EUR", updatedAt: "2026-04-27T11:00:00.000Z" });

    await expect(repository.getByKeyAsync("currency")).resolves.toEqual({
      key: "currency",
      value: "EUR",
      updatedAt: "2026-04-27T11:00:00.000Z",
    });
  });

  it("saves and reads business settings after migrations", async () => {
    const mock = createMockDatabaseClient();
    await migrateDatabaseAsync(mock.client);

    const repository = new SettingsRepository(mock.client);
    await repository.saveBusinessSettingsAsync(
      {
        businessName: "Dulces Maria",
        currency: "USD",
        avatarId: "chef",
        phone: "+53 555 1234",
      },
      "2026-04-27T14:00:00.000Z"
    );

    const settings = await repository.getBusinessSettingsAsync();

    expect(settings).toEqual({
      businessName: "Dulces Maria",
      currency: "USD",
      avatarId: "chef",
      phone: "+53 555 1234",
      address: undefined,
    });
    expect(mock.getUserVersion()).toBe(3);
  });

  it("reads minimal business settings and returns null when required fields are missing", async () => {
    const repository = new SettingsRepository(createMockDatabaseClient().client);

    await expect(repository.getBusinessSettingsAsync()).resolves.toBeNull();

    await repository.saveBusinessSettingsAsync(
      {
        businessName: "Dulces Maria",
        currency: "CUP",
      },
      "2026-04-27T14:00:00.000Z"
    );

    await expect(repository.getBusinessSettingsAsync()).resolves.toEqual({
      businessName: "Dulces Maria",
      currency: "CUP",
      avatarId: undefined,
      phone: undefined,
      address: undefined,
    });
  });

  it("saves and reads accessibility settings including false high contrast", async () => {
    const repository = new SettingsRepository(createMockDatabaseClient().client);

    await repository.saveAccessibilitySettingsAsync(
      { fontScale: 1.2, highContrastEnabled: false },
      "2026-04-27T14:00:00.000Z"
    );

    await expect(repository.getAccessibilitySettingsAsync()).resolves.toEqual({
      fontScale: 1.2,
      highContrastEnabled: false,
    });
  });

  it("returns null for invalid accessibility font scale", async () => {
    const repository = new SettingsRepository(createMockDatabaseClient().client);

    await repository.upsertAsync({
      key: "font_scale",
      value: "not-a-number",
      updatedAt: "2026-04-27T14:00:00.000Z",
    });
    await repository.upsertAsync({
      key: "high_contrast_enabled",
      value: "true",
      updatedAt: "2026-04-27T14:00:00.000Z",
    });

    await expect(repository.getAccessibilitySettingsAsync()).resolves.toBeNull();
  });
});
