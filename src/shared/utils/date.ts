const DAY_IN_MS = 1000 * 60 * 60 * 24;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDisplayDate(date: string | Date, now = new Date()): string {
  const targetDate = new Date(date);

  if (Number.isNaN(targetDate.getTime())) {
    return "Fecha no disponible";
  }

  const target = startOfDay(targetDate);
  const current = startOfDay(now);
  const diffInDays = Math.floor((current.getTime() - target.getTime()) / DAY_IN_MS);

  if (diffInDays === 0) {
    return "Hoy";
  }

  if (diffInDays === 1) {
    return "Ayer";
  }

  if (diffInDays >= 2 && diffInDays <= 6) {
    return `Hace ${diffInDays} días`;
  }

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(targetDate);
}
