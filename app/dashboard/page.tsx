import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GmailPanel } from "@/components/gmail-panel"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const hasGoogleCredentials = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gmail Integration Panel</h1>
            <p className="text-muted-foreground">Manage your Gmail integration and view your emails</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/setup">
              <Settings className="mr-2 h-4 w-4" />
              Setup Guide
            </Link>
          </Button>
        </div>

        {!hasGoogleCredentials && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>Configuration Required:</strong> Google OAuth credentials are not configured. Please follow the{" "}
              <Link href="/setup" className="font-medium underline hover:no-underline">
                Setup Guide
              </Link>{" "}
              to configure your integration.
            </p>
          </div>
        )}

        <GmailPanel />
      </div>
    </div>
  )
}
