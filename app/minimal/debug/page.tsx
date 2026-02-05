/**
 * Debug page at /minimal/debug - minimal layout, no main nav.
 * If this loads but /dashboard freezes, the issue is in the main app.
 */
export default function MinimalDebugPage() {
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Debug OK</h1>
      <p className="mt-2 text-[var(--color-text-muted)]">
        If you see this, the app shell works. The freeze is in dashboard/sync.
      </p>
      <a
        href="/dashboard"
        className="mt-4 inline-block px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90"
      >
        Try Dashboard →
      </a>
    </div>
  )
}
