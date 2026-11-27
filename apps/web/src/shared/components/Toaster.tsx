import { CircleAlert, CircleCheck } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";

const ICON_CLASS = "size-5 shrink-0";

// Sonner still positions and stacks the toasts; unstyled drops its look so the
// app's theme tokens apply. The light theme is fixed because the app has no
// dark mode, which also keeps Sonner from reading prefers-color-scheme.
const TOAST_CLASS_NAMES = {
  toast:
    "flex w-full items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-3 font-sans text-sm text-ink shadow-xl",
  title: "font-medium",
  icon: "flex shrink-0",
};

const TOAST_ICONS = {
  success: (
    <CircleCheck
      aria-hidden="true"
      strokeWidth={1.5}
      className={`${ICON_CLASS} text-brand`}
    />
  ),
  error: (
    <CircleAlert
      aria-hidden="true"
      strokeWidth={1.5}
      className={`${ICON_CLASS} text-red-600`}
    />
  ),
};

// Mounted once, in RootLayout. Show toasts with shared/utils/toast.ts.
function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      theme="light"
      icons={TOAST_ICONS}
      toastOptions={{ unstyled: true, classNames: TOAST_CLASS_NAMES }}
    />
  );
}

export default Toaster;
