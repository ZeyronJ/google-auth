import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: tokenData, error } = await supabase
      .from("gmail_tokens")
      .select("email, updated_at")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error || tokenData === null) {
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: true,
      email: tokenData.email,
      lastSync: tokenData.updated_at,
    })
  } catch (error) {
    console.error("[v0] Status check error:", error)
    return NextResponse.json({ connected: false })
  }
}
