"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabaseClient"

export default function Page() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // User is logged in, redirect to dashboard
        router.push('/dashboard')
      } else {
        // User is not logged in, redirect to signin
        router.push('/signin')
      }
    }

    checkAuth()
  }, [router, supabase.auth])

  // Show loading while checking auth
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center gap-6 text-center p-6">
      <div className="space-y-3">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">RevImpact — Make Customer Impact measurable.</h1>
        <p className="text-lg md:text-xl text-impact-dark/80">AI that turns customer data into impact.</p>
      </div>
      <div className="flex gap-3">
        <div className="rounded-md bg-impact-blue text-white px-5 py-2.5 font-medium shadow opacity-75">
          Loading...
        </div>
      </div>
    </main>
  )
}
