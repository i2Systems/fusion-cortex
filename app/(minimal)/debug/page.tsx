/**
 * Debug page - minimal, no heavy hooks.
 * If this loads but /dashboard freezes, the issue is in the main app.
 */
export default function DebugPage() {
  return (
    <div>
      <h1 className="text-xl font-bold">Debug OK</h1>
      <p className="mt-2 text-[var(--color-text-muted)]">
        If you see this, the app shell works. The freeze is in dashboard/sync.
      </p>
      <a href="/dashboard" className="mt-4 inline-block text-[var(--color-primary)] hover:underline">
        Try Dashboard →
      </a>
    </div>
  )
}
