import ListSkeleton from "../../../shared/components/ListSkeleton.tsx";
import Skeleton from "../../../shared/components/Skeleton.tsx";

// Stands in for ContactsPage while the contacts load.
function ContactsPageSkeleton() {
  return (
    <section className="flex h-full w-full flex-col border-line bg-panel xl:max-w-2xl xl:border-r">
      <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-4">
        <h1 className="font-serif text-[30px] text-ink">Contacts</h1>
        <Skeleton className="size-9 rounded-full" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden border-t border-line">
        <ListSkeleton label="Loading contacts" />
      </div>
    </section>
  );
}

export default ContactsPageSkeleton;
