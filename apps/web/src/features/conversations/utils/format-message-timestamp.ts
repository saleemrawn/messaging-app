import { format, isSameDay, parseISO, subDays } from "date-fns";

// "10:00 AM" today, "Yesterday, 10:00 AM" for the previous calendar day,
// otherwise "Mon 12th Jun, 10:00 AM".
function formatMessageTimestamp(iso: string, now = new Date()): string {
  const date = parseISO(iso);
  const time = format(date, "h:mm a");

  if (isSameDay(date, now)) return time;
  if (isSameDay(date, subDays(now, 1))) return `Yesterday, ${time}`;
  return `${format(date, "EEE do MMM")}, ${time}`;
}

export { formatMessageTimestamp };
