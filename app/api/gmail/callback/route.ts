import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { exchangeCodeForTokens, getUserEmail } from "@/lib/gmail"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?error=${error}`)
    }

    if (!code) {
      return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?error=no_code`)
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${request.nextUrl.origin}/auth/login`)
    }

    const redirectUri = `${request.nextUrl.origin}/api/gmail/callback`
    const tokens = await exchangeCodeForTokens(code, redirectUri)
    const email = await getUserEmail(tokens.access_token)

    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    const { error: dbError } = await supabase.from("gmail_tokens").upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokenExpiry,
        email: email,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )

    if (dbError) {
      console.error("[v0] Error saving tokens:", dbError)
      return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?error=token_save_failed`)
    }

    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?connected=true`)
  } catch (error) {
    console.error("[v0] OAuth callback error:", error)
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?error=callback_failed`)
  }
}
