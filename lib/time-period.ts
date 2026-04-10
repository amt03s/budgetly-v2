// Helpers for defining time periods (weekly / monthly / yearly / all), filtering transactions by period, and generating human-readable period labels.

export type TimePeriod = "weekly" | "monthly" | "yearly" | "all"

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map((part) => Number(part))
  return new Date(year, (month || 1) - 1, day || 1)
}

function getPeriodStartDate(period: TimePeriod, now: Date): Date {
  const today = startOfDay(now)

  if (period === "all") {
    return new Date(1970, 0, 1)
  }

  if (period === "weekly") {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
  }

  if (period === "monthly") {
    return new Date(today.getFullYear(), today.getMonth(), 1)
  }

  return new Date(today.getFullYear(), 0, 1)
}

export function isDateInPeriod(dateKey: string, period: TimePeriod, now = new Date()): boolean {
  const start = getPeriodStartDate(period, now)
  const end = startOfDay(now)
  const target = startOfDay(parseDateKey(dateKey))
  return target >= start && target <= end
}

export function periodLabel(period: TimePeriod): string {
  if (period === "weekly") return "This week"
  if (period === "monthly") return "This month"
  if (period === "all") return "All time"
  return "This year"
}
