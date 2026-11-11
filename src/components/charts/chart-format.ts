const preciseShareFormat = new Intl.NumberFormat("en", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** One decimal place, for shares that sit close together (6.1% against 7.8%). */
export const formatShare = (ratio: number) => preciseShareFormat.format(ratio);

/** "12am", "3pm": hours as people say them, without building a Date. */
export function formatHour(hour: number) {
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}${hour < 12 || hour === 24 ? "am" : "pm"}`;
}

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
