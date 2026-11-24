function ErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-gray-600">
        We couldn&apos;t reach the server. Please try again.
      </p>
      <button
        type="button"
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
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
