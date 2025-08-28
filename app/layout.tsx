import type { Metadata } from "next"
import "../styles/globals.css"

export const metadata: Metadata = {
  title: "RevImpact — Make Customer Success measurable.",
  description: "AI that turns customer data into impact."
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-impact-light text-impact-dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
