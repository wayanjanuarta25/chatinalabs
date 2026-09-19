import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const rawNext = requestUrl.searchParams.get('next') ?? '/chat'

  // Prevent open redirect vulnerabilities: ensure next is a relative path
  const next = (rawNext.startsWith('/') && !rawNext.startsWith('//')) ? rawNext : '/chat'

  // Resolve canonical origin:
  // 1. Configured canonical APP_URL / SITE_URL
  // 2. Reverse proxy headers (x-forwarded-host & x-forwarded-proto)
  // 3. Fallback to request origin
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'

  const baseUrl = appUrl
    ? appUrl.replace(/\/+$/, '')
    : forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?message=Could not authenticate user`)
}
