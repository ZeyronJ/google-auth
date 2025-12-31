"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Mail, RefreshCw, Link2, Unlink, AlertCircle, Copy, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { GmailMessage } from "@/lib/gmail"

interface GmailStatus {
  connected: boolean
  email?: string
  lastSync?: string
}

export function GmailPanel() {
  const [status, setStatus] = useState<GmailStatus>({ connected: false })
  const [messages, setMessages] = useState<GmailMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/api/gmail/callback` : ""

  useEffect(() => {
    checkStatus()
  }, [])

  useEffect(() => {
    if (status.connected) {
      fetchMessages()
      setupSSE()
    }
  }, [status.connected])

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/gmail/status")
      const data = await res.json()
      setStatus(data)
      setIsLoading(false)
    } catch (error) {
      console.error("[v0] Error checking status:", error)
      setIsLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/gmail/messages")
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error("[v0] Error fetching messages:", error)
    }
  }

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      setError(null)
      console.log("[v0] Attempting to connect to Gmail")

      const res = await fetch("/api/gmail/connect")
      console.log("[v0] Connect response status:", res.status)

      const data = await res.json()
      console.log("[v0] Connect response data:", data)

      if (data.error) {
        console.error("[v0] Connect error:", data.error)
        setError(data.error)
        setIsConnecting(false)
        return
      }

      if (data.authUrl) {
        console.log("[v0] Redirecting to auth URL")
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error("[v0] Error connecting:", error)
      setError("Failed to connect to Gmail. Please try again.")
      setIsConnecting(false)
    }
  }

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      await fetch("/api/gmail/sync", { method: "POST" })
      await fetchMessages()
    } catch (error) {
      console.error("[v0] Error syncing:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await fetch("/api/gmail/disconnect", { method: "POST" })
      setStatus({ connected: false })
      setMessages([])
    } catch (error) {
      console.error("[v0] Error disconnecting:", error)
    }
  }

  const setupSSE = () => {
    const eventSource = new EventSource("/api/gmail/events")

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "new_message") {
        fetchMessages()
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => eventSource.close()
  }

  const copyRedirectUri = () => {
    navigator.clipboard.writeText(redirectUri)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!status.connected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Connect Your Gmail</CardTitle>
          <CardDescription>Connect your Gmail account to view and manage your emails</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Alert className="w-full border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <p className="font-medium mb-2">Configura este Redirect URI en Google Cloud Console:</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 rounded bg-white px-3 py-2 text-xs break-all border">{redirectUri}</code>
                <Button size="sm" variant="outline" onClick={copyRedirectUri} className="shrink-0 bg-transparent">
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs mt-2">
                Ve a Google Cloud Console → Credenciales → Tu OAuth Client → URIs de redirección autorizados
              </p>
            </AlertDescription>
          </Alert>

          {error && (
            <div className="w-full space-y-3">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
              {error.includes("not configured") && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-900 text-center">
                    Need help setting up Google OAuth?{" "}
                    <a href="/setup" className="font-medium underline hover:no-underline">
                      View Setup Guide
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
          <Button onClick={handleConnect} size="lg" disabled={isConnecting}>
            {isConnecting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Connecting...
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />
                Connect Gmail
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <a href="/setup" className="text-primary hover:underline">
              View full setup guide
            </a>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gmail Inbox</CardTitle>
              <CardDescription className="mt-1">
                Connected as <span className="font-medium">{status.email}</span>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                Sync
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-2">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No messages found</p>
              <p className="text-sm text-muted-foreground mt-2">Click sync to fetch your emails</p>
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{message.from_name || message.from_email}</p>
                      {!message.is_read && (
                        <Badge variant="default" className="shrink-0">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium mb-1 truncate">{message.subject || "(No subject)"}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{message.snippet}</p>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {new Date(message.received_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
