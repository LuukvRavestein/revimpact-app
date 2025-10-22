import type { Metadata } from "next"
import "../styles/globals.css"
import { LanguageProvider } from "@/contexts/LanguageContext"

export const metadata: Metadata = {
  title: "RevImpact — Make Customer Impact measurable.",
  description: "AI that turns customer data into impact."
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-impact-light text-impact-dark">
      <body className="min-h-screen antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
