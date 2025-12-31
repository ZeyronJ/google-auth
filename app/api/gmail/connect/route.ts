import { type NextRequest, NextResponse } from "next/server"
import { getGoogleAuthUrl } from "@/lib/gmail"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Gmail connect route called")
    console.log("[v0] CLIENT_ID exists:", !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
    console.log("[v0] CLIENT_SECRET exists:", !!process.env.GOOGLE_CLIENT_SECRET)
    console.log("[v0] Origin:", request.nextUrl.origin)

    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("[v0] Missing OAuth credentials")
      return NextResponse.json(
        {
          error:
            "Google OAuth credentials are not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables.",
        },
        { status: 500 },
      )
    }

    const redirectUri = `${request.nextUrl.origin}/api/gmail/callback`
    console.log("[v0] Redirect URI:", redirectUri)

    const authUrl = await getGoogleAuthUrl(redirectUri)
    console.log("[v0] Auth URL generated successfully")

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("[v0] Error getting auth URL:", error)
    return NextResponse.json({ error: "Failed to generate auth URL" }, { status: 500 })
  }
}
