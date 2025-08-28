"use client"

import { useEffect, useState } from "react"

function PingStatus() {
  const [status, setStatus] = useState<string>("Checking...")
  useEffect(() => {
    fetch("/api/ping").then(async (r) => {
      const data = await r.json()
      setStatus(`ok: ${String(data.ok)}, ts: ${String(data.ts)}`)
    }).catch(() => setStatus("unreachable"))
  }, [])
  return <p className="text-sm text-impact-dark/70">Status: {status}</p>
}

export default function Page() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center gap-6 text-center p-6">
      <div className="space-y-3">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">RevImpact — Make Customer Success measurable.</h1>
        <p className="text-lg md:text-xl text-impact-dark/80">AI that turns customer data into impact.</p>
      </div>
      <div className="flex gap-3">
        <a href="#" className="rounded-md bg-impact-blue text-white px-5 py-2.5 font-medium shadow hover:opacity-95">Join the Beta</a>
        <a href="#" className="rounded-md bg-impact-light text-impact-dark px-5 py-2.5 font-medium ring-1 ring-impact-dark/10 hover:bg-white">Learn more</a>
      </div>
      <PingStatus />
    </main>
  )
}
