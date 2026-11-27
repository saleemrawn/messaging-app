interface SkeletonProps {
  // Size and shape, e.g. "h-3 w-32" or "size-11 rounded-full".
  className: string;
}

// A pulsing placeholder block for content that is still loading.
function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`rounded bg-line motion-safe:animate-pulse ${className}`}
    />
  );
}

export default Skeleton;
