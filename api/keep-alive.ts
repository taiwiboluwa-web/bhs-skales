export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // These are the same public Supabase client credentials used by the storefront.
  // A server-only service-role key is intentionally NOT used here.
  const supabaseUrl = process.env.SUPABASE_URL || 'https://efogrjhuqyzvgrahobto.supabase.co'
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmb2dyamh1cXl6dmdyYWhvYnRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Mzk2NDYsImV4cCI6MjEwMTAxNTY0fQ.ig8HKUiqGSExaQZcLsVbVti1m1XjhJyKNBpl7sJZkNI'

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/products?select=id&limit=1`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const detail = await response.text()
      return Response.json({ ok: false, status: response.status, detail }, { status: 502 })
    }

    return Response.json({
      ok: true,
      service: 'bhs-skales-supabase-health-check',
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 502 })
  }
}
