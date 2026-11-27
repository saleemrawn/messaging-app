import LoadingStatus from "./LoadingStatus.tsx";
import Skeleton from "./Skeleton.tsx";

const DEFAULT_ROW_COUNT = 6;

// Text bar widths, cycled through so the rows don't look identical.
const ROW_WIDTHS = [
  { title: "w-32", subtitle: "w-48" },
  { title: "w-24", subtitle: "w-40" },
  { title: "w-36", subtitle: "w-52" },
  { title: "w-28", subtitle: "w-36" },
] as const;

interface ListSkeletonProps {
  label: string;
  rowCount?: number;
}

// Placeholder rows for a list of people: an avatar beside two lines of text.
function ListSkeleton({ label, rowCount = DEFAULT_ROW_COUNT }: ListSkeletonProps) {
  const rows = Array.from({ length: rowCount }, (_, index) => {
    const widths = ROW_WIDTHS[index % ROW_WIDTHS.length] ?? ROW_WIDTHS[0];
    return { id: index, ...widths };
  });

  return (
    <LoadingStatus label={label}>
      <ul aria-hidden="true" className="flex flex-col">
        {rows.map(({ id, title, subtitle }) => (
          <li key={id} className="flex items-center gap-3 px-4 py-4 sm:px-6">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className={`h-3 max-w-full ${title}`} />
              <Skeleton className={`h-3 max-w-full ${subtitle}`} />
            </div>
          </li>
        ))}
      </ul>
    </LoadingStatus>
  );
}

export default ListSkeleton;
