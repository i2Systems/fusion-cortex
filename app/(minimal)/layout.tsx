/**
 * Minimal layout - NO StateHydration, NO main nav, NO sync hooks.
 * Use /minimal to test if the freeze is in the main app.
 */
export default function MinimalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen p-8 bg-[var(--color-background)]">
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        Minimal route — no sync hooks, no tRPC queries
      </p>
      {children}
    </div>
  )
}
