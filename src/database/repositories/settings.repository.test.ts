import { migrateDatabaseAsync } from "@/database/migrations";
import { SettingsRepository } from "@/database/repositories";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";

describe("SettingsRepository", () => {
  it("saves and reads business settings after migrations", async () => {
    const mock = createMockDatabaseClient();
    await migrateDatabaseAsync(mock.client);

    const repository = new SettingsRepository(mock.client);
    await repository.saveBusinessSettingsAsync(
      {
        businessName: "Dulces Maria",
        currency: "USD",
        phone: "+53 555 1234",
      },
      "2026-04-27T14:00:00.000Z"
    );

    const settings = await repository.getBusinessSettingsAsync();

    expect(settings).toEqual({
      businessName: "Dulces Maria",
      currency: "USD",
      phone: "+53 555 1234",
      address: undefined,
    });
    expect(mock.getUserVersion()).toBe(1);
  });
});
