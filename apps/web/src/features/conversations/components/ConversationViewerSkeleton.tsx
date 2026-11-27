import LoadingStatus from "../../../shared/components/LoadingStatus.tsx";
import Skeleton from "../../../shared/components/Skeleton.tsx";

// Alternating received (left) and sent (right) bubbles of varied widths.
const BUBBLES = [
  { id: 1, isSent: false, width: "w-56" },
  { id: 2, isSent: true, width: "w-40" },
  { id: 3, isSent: false, width: "w-72" },
  { id: 4, isSent: true, width: "w-64" },
  { id: 5, isSent: false, width: "w-44" },
] as const;

// Stands in for ConversationViewer while a conversation loads: header, message
// history and composer, laid out like the real thing.
function ConversationViewerSkeleton() {
  return (
    <LoadingStatus
      label="Loading conversation"
      className="flex min-w-0 flex-1 flex-col bg-canvas"
    >
      <div className="flex items-center gap-3 border-b border-line px-4 py-5 sm:px-8 sm:py-7">
        <Skeleton className="size-11 shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-40 max-w-full" />
          <Skeleton className="h-3 w-52 max-w-full" />
        </div>
      </div>
      <ol
        aria-hidden="true"
        className="flex min-h-0 flex-1 flex-col justify-end gap-7 overflow-hidden px-4 py-6 sm:px-8 sm:py-8"
      >
        {BUBBLES.map(({ id, isSent, width }) => (
          <li
            key={id}
            className={`flex max-w-[70%] items-start gap-3 ${isSent ? "self-end" : "self-start"}`}
          >
            {!isSent && <Skeleton className="size-11 shrink-0 rounded-full" />}
            <Skeleton className={`h-11 max-w-full rounded-[14px] ${width}`} />
          </li>
        ))}
      </ol>
      <div className="px-4 pt-2 pb-4 sm:px-8 sm:pb-6">
        <Skeleton className="h-18 w-full rounded-xl" />
      </div>
    </LoadingStatus>
  );
}

export default ConversationViewerSkeleton;
