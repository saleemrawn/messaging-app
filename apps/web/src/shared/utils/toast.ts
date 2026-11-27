import { toast } from "sonner";

// Errors stay up longer than confirmations: they usually ask for a retry.
const ERROR_TOAST_DURATION_MS = 6000;

// Plain functions rather than hooks, so route actions can call them too. They
// do nothing visible unless the app's <Toaster> is mounted (RootLayout).
function showSuccessToast(message: string): void {
  toast.success(message);
}

function showErrorToast(message: string): void {
  toast.error(message, { duration: ERROR_TOAST_DURATION_MS });
}

export { showSuccessToast, showErrorToast };
