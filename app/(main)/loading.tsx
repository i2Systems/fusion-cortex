/**
 * Main layout loading state
 */
export default function MainLoading() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
        <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
      </div>
    </div>
  )
}
