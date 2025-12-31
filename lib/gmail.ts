export interface GmailToken {
  access_token: string
  refresh_token: string
  token_expiry: string
  email: string
}

export interface GmailMessage {
  id: string
  thread_id: string
  subject: string | null
  from_email: string
  from_name: string | null
  snippet: string | null
  body_preview: string | null
  received_at: string
  is_read: boolean
  labels: string[]
}

export async function getGoogleAuthUrl(redirectUri: string): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured")
  }

  const scopes = ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/userinfo.email"]

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to exchange code for tokens")
  }

  const data = await response.json()
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  }
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to refresh access token")
  }

  const data = await response.json()
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  }
}

export async function fetchGmailMessages(accessToken: string, maxResults = 20) {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=in:inbox`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] Gmail API error response:", errorText)
    throw new Error("Failed to fetch Gmail messages")
  }

  const data = await response.json()
  const messages = data.messages || []

  const detailedMessages = await Promise.all(
    messages.map(async (msg: { id: string }) => {
      const msgResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!msgResponse.ok) return null

      const msgData = await msgResponse.json()
      const headers = msgData.payload.headers

      const getHeader = (name: string) => headers.find((h: { name: string }) => h.name === name)?.value || ""

      const from = getHeader("From")
      const fromMatch = from.match(/^(.*?)\s*<(.+)>$/) || [null, from, from]

      return {
        id: msgData.id,
        thread_id: msgData.threadId,
        subject: getHeader("Subject"),
        from_email: fromMatch[2] || from,
        from_name: fromMatch[1] || null,
        snippet: msgData.snippet,
        body_preview: msgData.snippet,
        received_at: new Date(Number.parseInt(msgData.internalDate)).toISOString(),
        is_read: !msgData.labelIds?.includes("UNREAD"),
        labels: msgData.labelIds || [],
      }
    }),
  )

  return detailedMessages.filter(Boolean)
}

export async function getUserEmail(accessToken: string): Promise<string> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch user email")
  }

  const data = await response.json()
  return data.email
}
