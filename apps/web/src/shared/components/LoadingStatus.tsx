import type { ReactNode } from "react";

interface LoadingStatusProps {
  // What is loading, e.g. "Loading contacts". Names the region for assistive
  // tech, which otherwise only meets hidden placeholders.
  label: string;
  className?: string;
  children: ReactNode;
}

// Wraps a skeleton in a status region, so screen readers hear what's loading.
function LoadingStatus({ label, className = "", children }: LoadingStatusProps) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export default LoadingStatus;
