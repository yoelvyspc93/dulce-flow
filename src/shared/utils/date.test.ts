import { formatDisplayDate } from "./date";

describe("formatDisplayDate", () => {
  const now = new Date("2026-04-28T15:30:00.000Z");

  it("returns an unavailable label for invalid dates", () => {
    expect(formatDisplayDate("invalid-date", now)).toBe("Fecha no disponible");
  });

  it("formats today's date", () => {
    expect(formatDisplayDate("2026-04-28T08:00:00.000Z", now)).toBe("Hoy");
  });

  it("formats yesterday's date", () => {
    expect(formatDisplayDate("2026-04-27T08:00:00.000Z", now)).toBe("Ayer");
  });

  it("formats dates from two to six days ago as relative dates", () => {
    expect(formatDisplayDate("2026-04-26T08:00:00.000Z", now)).toBe("Hace 2 días");
    expect(formatDisplayDate("2026-04-22T08:00:00.000Z", now)).toBe("Hace 6 días");
  });

  it("formats dates older than six days as short absolute dates", () => {
    expect(formatDisplayDate("2026-04-21T08:00:00.000Z", now)).toBe("21 abr 2026");
  });

  it("formats future dates as short absolute dates", () => {
    expect(formatDisplayDate("2026-04-29T08:00:00.000Z", now)).toBe("29 abr 2026");
  });
});
