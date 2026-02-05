/**
 * Root loading state - shows immediately while app loads
 */
export default function Loading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-background)]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
        <p className="text-sm text-[var(--color-text-muted)]">Loading Fusion...</p>
      </div>
    </div>
  )
}
