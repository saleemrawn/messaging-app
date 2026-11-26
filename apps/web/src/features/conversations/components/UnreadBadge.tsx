interface UnreadBadgeProps {
  count: number;
}

function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count <= 0) return null;

  const label = `${String(count)} unread ${count === 1 ? "message" : "messages"}`;

  return (
    <span className="flex h-5.5 min-w-5.5 items-center justify-center rounded-md bg-brand px-1.5 text-[11px] font-medium text-white">
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export default UnreadBadge;
