function ErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
      <h1 className="font-serif text-[30px] text-ink">Something went wrong</h1>
      <p className="text-muted">
        We couldn&apos;t reach the server. Please try again.
      </p>
      <button
        type="button"
        className="rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-strong"
        onClick={() => {
          window.location.reload();
        }}
      >
        Retry
      </button>
    </main>
  );
}

export default ErrorPage;
