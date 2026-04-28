import { getDashboardDateRange } from "./dashboard.service";

describe("getDashboardDateRange", () => {
  const now = new Date("2026-04-28T15:30:00.000Z");

  it("returns the start of the current day", () => {
    const expectedStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    expect(getDashboardDateRange("today", now).startDate).toBe(expectedStart);
  });

  it("returns an open range for all", () => {
    expect(getDashboardDateRange("all", now)).toEqual({
      startDate: "0000-01-01T00:00:00.000Z",
      endDate: "2026-04-28T15:30:00.000Z",
    });
  });
});
