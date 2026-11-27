import ListSkeleton from "../../../shared/components/ListSkeleton.tsx";

// Stands in for ArchivePage while the archived conversations load.
function ArchivePageSkeleton() {
  return (
    <section className="flex h-full w-full flex-col border-line bg-panel xl:max-w-2xl xl:border-r">
      <h1 className="px-6 pt-8 pb-6 font-serif text-[30px] text-ink">Archive</h1>
      <div className="min-h-0 flex-1 overflow-hidden border-t border-line">
        <ListSkeleton label="Loading archived conversations" />
      </div>
    </section>
  );
}

export default ArchivePageSkeleton;
