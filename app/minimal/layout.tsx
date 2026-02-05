/**
 * Minimal layout for /minimal/* routes - no main nav, lighter UI.
 */
export default function MinimalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <p className="text-sm text-[var(--color-text-muted)] p-4 border-b border-[var(--color-border)]">
        Minimal route — no main nav
      </p>
      {children}
    </div>
  )
}
