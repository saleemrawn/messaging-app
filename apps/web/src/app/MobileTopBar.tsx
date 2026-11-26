import type { Ref } from "react";
import { Menu } from "lucide-react";

interface MobileTopBarProps {
  menuButtonRef: Ref<HTMLButtonElement>;
  isMenuOpen: boolean;
  onOpenMenu: () => void;
}

// Below desktop, the sidebar is hidden and opens from this bar's menu button.
function MobileTopBar({
  menuButtonRef,
  isMenuOpen,
  onOpenMenu,
}: MobileTopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-sidebar px-2">
      <button
        ref={menuButtonRef}
        type="button"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={isMenuOpen}
        onClick={onOpenMenu}
        className="rounded-lg p-2 text-ink hover:bg-tint/60 focus-visible:outline-2 focus-visible:outline-brand"
      >
        <Menu aria-hidden="true" strokeWidth={1.5} />
      </button>
      <p className="font-serif text-xl text-ink">messgr.</p>
    </header>
  );
}

export default MobileTopBar;
