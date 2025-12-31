import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      sendEvent({ type: "connected", timestamp: Date.now() })

      const pollInterval = setInterval(async () => {
        try {
          const { data: messages } = await supabase
            .from("gmail_messages")
            .select("*")
            .eq("user_id", user.id)
            .order("received_at", { ascending: false })
            .limit(1)

          if (messages && messages.length > 0) {
            sendEvent({
              type: "new_message",
              message: messages[0],
              timestamp: Date.now(),
            })
          }
        } catch (error) {
          console.error("[v0] SSE poll error:", error)
        }
      }, 10000) // Poll every 10 seconds

      request.signal.addEventListener("abort", () => {
        clearInterval(pollInterval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
