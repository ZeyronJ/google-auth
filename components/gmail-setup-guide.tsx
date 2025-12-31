"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function GmailSetupGuide() {
  const [copiedId, setCopiedId] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/api/gmail/callback` : ""

  const copyToClipboard = (text: string, type: "id" | "secret") => {
    navigator.clipboard.writeText(text)
    if (type === "id") {
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    } else {
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Configuración de Google Cloud Console</CardTitle>
        <CardDescription>Sigue estos pasos para configurar OAuth2 con Gmail</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Necesitas configurar un proyecto OAuth2 en Google Cloud Console para que la integración con Gmail funcione.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                1
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-medium">Crea un proyecto en Google Cloud Console</p>
                <p className="text-sm text-muted-foreground">
                  Ve a{" "}
                  <a
                    href="https://console.cloud.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    console.cloud.google.com
                  </a>{" "}
                  y crea un nuevo proyecto (o usa uno existente)
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                2
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-medium">Habilita Gmail API</p>
                <p className="text-sm text-muted-foreground">
                  En el menú lateral, ve a "APIs y Servicios" → "Biblioteca" y busca "Gmail API". Haz clic en
                  "Habilitar".
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                3
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-medium">Configura la pantalla de consentimiento OAuth</p>
                <p className="text-sm text-muted-foreground">
                  Ve a "APIs y Servicios" → "Pantalla de consentimiento de OAuth"
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
                  <li>Selecciona "Externo" como tipo de usuario</li>
                  <li>Completa el nombre de la aplicación y tu email</li>
                  <li>Agrega los scopes: Gmail API (lectura) y email</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                4
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-medium">Crea credenciales OAuth 2.0</p>
                <p className="text-sm text-muted-foreground">
                  Ve a "APIs y Servicios" → "Credenciales" → "Crear credenciales" → "ID de cliente de OAuth 2.0"
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
                  <li>Tipo de aplicación: "Aplicación web"</li>
                  <li>Nombre: "Gmail Integration Panel"</li>
                  <li>
                    <strong>URI de redirección autorizada</strong> (MUY IMPORTANTE):
                  </li>
                </ul>
                {redirectUri && (
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted px-3 py-2 text-sm">{redirectUri}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(redirectUri, "id")}
                      className="shrink-0"
                    >
                      {copiedId ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
                <Alert className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>IMPORTANTE:</strong> Debes agregar exactamente esta URL en "URIs de redirección autorizados"
                    en Google Cloud Console. Si no coincide exactamente, el OAuth fallará.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                5
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-medium">Agrega las variables de entorno</p>
                <p className="text-sm text-muted-foreground">
                  Después de crear las credenciales, copia el Client ID y Client Secret y agrégalos en la sección "Vars"
                  del panel lateral:
                </p>
                <div className="mt-3 space-y-2">
                  <div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>
                    <p className="text-xs text-muted-foreground mt-1">Tu Client ID de Google</p>
                  </div>
                  <div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">GOOGLE_CLIENT_SECRET</code>
                    <p className="text-xs text-muted-foreground mt-1">Tu Client Secret de Google</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Después de completar estos pasos y agregar las variables de entorno, recarga la página y podrás conectar
              tu cuenta de Gmail.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  )
}
