"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { createSupabaseBrowserClient } from "@/lib/supabaseClient"

interface Invitation {
  id: string
  workspace_id: string
  email: string
  role: string
  status: string
  expires_at: string
  workspaces: {
    name: string
  }
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    if (params.token) {
      loadInvitation(params.token as string)
    }
  }, [params.token])

  const loadInvitation = async (_token: string) => {
    try {
      // In a real implementation, you would fetch the invitation from the database
      // For now, we'll simulate this
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock invitation data
      const mockInvitation: Invitation = {
        id: "mock-id",
        workspace_id: "mock-workspace-id",
        email: "user@example.com",
        role: "member",
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        workspaces: {
          name: "Acme Corporation"
        }
      }
      
      setInvitation(mockInvitation)
    } catch (error) {
      console.error("Error loading invitation:", error)
      setError("Failed to load invitation")
    } finally {
      setIsLoading(false)
    }
  }

  const acceptInvitation = async () => {
    if (!invitation) return

    setIsAccepting(true)
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        // Redirect to signin with return URL
        router.push(`/signin?redirect=/invite/${params.token}`)
        return
      }

      // In a real implementation, you would:
      // 1. Verify the invitation token
      // 2. Add the user to the workspace
      // 3. Update the invitation status
      // 4. Redirect to the workspace

      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error("Error accepting invitation:", error)
      setError("Failed to accept invitation")
    } finally {
      setIsAccepting(false)
    }
  }

  const declineInvitation = async () => {
    if (!invitation) return

    try {
      // In a real implementation, you would update the invitation status to 'declined'
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert("Invitation declined")
      router.push('/')
    } catch (error) {
      console.error("Error declining invitation:", error)
      setError("Failed to decline invitation")
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Loading invitation...</h1>
        </div>
      </main>
    )
  }

  if (error || !invitation) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h1 className="text-xl font-semibold mb-2">Invalid Invitation</h1>
            <p className="text-gray-600 mb-4">
              This invitation link is invalid or has expired.
            </p>
            <Button onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const isExpired = new Date(invitation.expires_at) < new Date()

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-semibold">You&apos;re Invited!</h1>
          <p className="text-gray-600">
            You&apos;ve been invited to join a workspace on RevImpact
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Workspace Details</h3>
            <p><strong>Workspace:</strong> {invitation.workspaces.name}</p>
            <p><strong>Role:</strong> {invitation.role}</p>
            <p><strong>Email:</strong> {invitation.email}</p>
            {isExpired && (
              <p className="text-red-600 text-sm mt-2">
                ⚠️ This invitation has expired
              </p>
            )}
          </div>

          {isExpired ? (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                This invitation has expired. Please contact the workspace owner for a new invitation.
              </p>
              <Button onClick={() => router.push('/')}>
                Go to Homepage
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button 
                onClick={acceptInvitation}
                disabled={isAccepting}
                className="w-full"
              >
                {isAccepting ? "Accepting..." : "Accept Invitation"}
              </Button>
              <Button 
                variant="secondary"
                onClick={declineInvitation}
                className="w-full"
              >
                Decline
              </Button>
            </div>
          )}

          <div className="text-center text-sm text-gray-500">
            <p>By accepting, you agree to join this workspace and follow its policies.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
