import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fetchGmailMessages, refreshAccessToken } from "@/lib/gmail"

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from("gmail_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: "Gmail not connected" }, { status: 404 })
    }

    let accessToken = tokenData.access_token
    const tokenExpiry = new Date(tokenData.token_expiry)

    if (tokenExpiry < new Date()) {
      const newTokens = await refreshAccessToken(tokenData.refresh_token)
      accessToken = newTokens.access_token

      const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString()

      await supabase
        .from("gmail_tokens")
        .update({
          access_token: newTokens.access_token,
          token_expiry: newExpiry,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
    }

    const messages = await fetchGmailMessages(accessToken)

    const messagesToInsert = messages.map((msg) => ({
      ...msg,
      user_id: user.id,
    }))

    const { error: insertError } = await supabase.from("gmail_messages").upsert(messagesToInsert, {
      onConflict: "id",
      ignoreDuplicates: false,
    })

    if (insertError) {
      console.error("[v0] Error inserting messages:", insertError)
      return NextResponse.json({ error: "Failed to sync messages" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: messages.length,
    })
  } catch (error) {
    console.error("[v0] Sync error:", error)
    return NextResponse.json({ error: "Failed to sync messages" }, { status: 500 })
  }
}
