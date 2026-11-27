import ListSkeleton from "../../../shared/components/ListSkeleton.tsx";
import Skeleton from "../../../shared/components/Skeleton.tsx";

interface ConversationListSkeletonProps {
  // Sized like ConversationList: a column beside the viewer, or full width.
  isSplitView: boolean;
}

// Stands in for ConversationList while the messages page loads.
function ConversationListSkeleton({ isSplitView }: ConversationListSkeletonProps) {
  return (
    <section
      className={`flex flex-col bg-panel ${isSplitView ? "w-90 shrink-0 border-r border-line" : "w-full"}`}
    >
      <div className="flex items-center justify-between gap-4 px-4 pt-8 pb-6 sm:px-6">
        <h1 className="font-serif text-[30px] text-ink">Messages</h1>
        <Skeleton className="size-10 rounded-[10px]" />
      </div>
      <div className="flex gap-2 px-4 pb-4 sm:px-6">
        <Skeleton className="h-8 w-28 rounded-[7px]" />
        <Skeleton className="h-8 w-20 rounded-[7px]" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <ListSkeleton label="Loading conversations" />
      </div>
    </section>
  );
}

export default ConversationListSkeleton;
