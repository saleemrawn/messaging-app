interface UnreadBadgeProps {
  count: number;
}

function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count <= 0) return null;

  const label = `${String(count)} unread ${count === 1 ? "message" : "messages"}`;

  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export default UnreadBadge;
