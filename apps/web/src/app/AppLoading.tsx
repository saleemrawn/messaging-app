import LoadingStatus from "../shared/components/LoadingStatus.tsx";

// Shown on first load until the session check and the page's data are in.
// The sidebar needs the current user, so this is just the logo.
function AppLoading() {
  return (
    <LoadingStatus
      label="Loading"
      className="flex h-dvh items-center justify-center bg-canvas"
    >
      <p
        aria-hidden="true"
        className="font-serif text-[30px] text-ink motion-safe:animate-pulse"
      >
        messgr.
      </p>
    </LoadingStatus>
  );
}

export default AppLoading;
