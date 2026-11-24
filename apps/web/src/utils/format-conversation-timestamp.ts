import { format, isSameDay, parseISO, subDays } from "date-fns";

// "10:00 AM" today, "Yesterday" for the previous calendar day,
// otherwise "Mon 12th Jun".
function formatConversationTimestamp(iso: string, now = new Date()): string {
  const date = parseISO(iso);

  if (isSameDay(date, now)) return format(date, "h:mm a");
  if (isSameDay(date, subDays(now, 1))) return "Yesterday";
  return format(date, "EEE do MMM");
}

export { formatConversationTimestamp };
