import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await supabase.from("gmail_tokens").delete().eq("user_id", user.id)

    await supabase.from("gmail_messages").delete().eq("user_id", user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Disconnect error:", error)
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 })
  }
}
