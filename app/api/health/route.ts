/**
 * Health check - use to verify server is responding
 * GET /api/health returns { ok: true }
 */
export async function GET() {
  return Response.json({ ok: true, timestamp: new Date().toISOString() })
}
