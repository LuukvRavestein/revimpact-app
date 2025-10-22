"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useLanguage } from "@/contexts/LanguageContext"
import Link from "next/link"
import { createSupabaseBrowserClient } from "@/lib/supabaseClient"

interface WorkspaceMember {
  id: string
  user_id: string
  role: string
  created_at: string
  user_email?: string
}

interface Workspace {
  id: string
  name: string
  created_by: string
  created_at: string
}

interface MembershipData {
  workspace_id: string
  role: string
  workspaces: Workspace | Workspace[]
}

export default function WorkspacePage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [isInviting, setIsInviting] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>("")
  const supabase = createSupabaseBrowserClient()
  const { t } = useLanguage()

  useEffect(() => {
    loadWorkspaceData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadWorkspaceData = async () => {
    try {
      // Get current user's workspace
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      // Get workspace membership
      const { data: memberships, error: mErr } = await supabase
        .from("workspace_members")
        .select(`
          workspace_id, 
          role, 
          workspaces!inner(id, name, created_by, created_at)
        `)
        .eq("user_id", session.user.id)
        .limit(1)

      if (mErr) throw new Error(mErr.message)

      const membership = memberships?.[0] as MembershipData | undefined
      if (membership) {
        // Handle the case where workspaces might be an array
        const workspaceData = Array.isArray(membership.workspaces) 
          ? membership.workspaces[0] 
          : membership.workspaces
        
        setWorkspace(workspaceData)
        setCurrentUserRole(membership.role)

        // Load all workspace members
        const { data: workspaceMembers, error: wmErr } = await supabase
          .from("workspace_members")
          .select(`
            id,
            user_id,
            role,
            created_at
          `)
          .eq("workspace_id", membership.workspace_id)

        if (wmErr) throw new Error(wmErr.message)
        
        // Transform the data to include mock email for now
        const membersWithEmail = (workspaceMembers || []).map(member => ({
          ...member,
          user_email: `user-${member.user_id.slice(0, 8)}@example.com` // Mock email
        }))
        
        setMembers(membersWithEmail)
      }
    } catch (error) {
      console.error("Error loading workspace:", error)
    }
  }

  const inviteUser = async () => {
    if (!inviteEmail || !workspace) return

    setIsInviting(true)
    try {
      // In a real implementation, you would:
      // 1. Send an invitation email
      // 2. Create a pending invitation record
      // 3. Allow the user to accept and join the workspace
      
      // For now, we'll simulate this
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert(`${t.workspace.sendInvite} ${inviteEmail}`)
      setInviteEmail("")
    } catch (error) {
      console.error("Error inviting user:", error)
      alert(t.error)
    } finally {
      setIsInviting(false)
    }
  }

  const removeMember = async (memberId: string) => {
    if (!confirm(t.confirm)) return

    try {
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("id", memberId)

      if (error) throw new Error(error.message)
      
      loadWorkspaceData() // Reload data
    } catch (error) {
      console.error("Error removing member:", error)
      alert(t.error)
    }
  }

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("workspace_members")
        .update({ role: newRole })
        .eq("id", memberId)

      if (error) throw new Error(error.message)
      
      loadWorkspaceData() // Reload data
    } catch (error) {
      console.error("Error updating role:", error)
      alert(t.error)
    }
  }

  if (!workspace) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">{t.loading}</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t.workspace.title}</h1>
          <p className="text-gray-600 mt-2">{t.workspace.subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <Link href="/dashboard">
            <Button variant="secondary">← {t.back} {t.navDashboard}</Button>
          </Link>
        </div>
      </div>

      {/* Workspace Info */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">{t.workspace.workspaceInfo}</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t.workspace.workspaceName}</label>
              <Input value={workspace.name} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t.workspace.created}</label>
              <Input value={new Date(workspace.created_at).toLocaleDateString()} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Users */}
      {currentUserRole === "owner" && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">{t.workspace.inviteTeam}</h2>
            <p className="text-gray-600">{t.workspace.inviteSubtitle}</p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder={t.workspace.emailPlaceholder}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={inviteUser}
                disabled={isInviting || !inviteEmail}
              >
                {isInviting ? t.workspace.sending : t.workspace.sendInvite}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">{t.workspace.teamMembers}</h2>
          <p className="text-gray-600">{members.length} {t.workspace.membersCount}{members.length !== 1 ? 's' : ''}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-impact-blue/10 rounded-full flex items-center justify-center">
                    <span className="text-impact-blue font-semibold">
                      {member.user_email?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{member.user_email || "Unknown User"}</p>
                    <p className="text-sm text-gray-500">
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {currentUserRole === "owner" && member.role !== "owner" ? (
                    <select
                      value={member.role}
                      onChange={(e) => updateMemberRole(member.id, e.target.value)}
                      className="p-2 border rounded-md"
                    >
                      <option value="member">{t.workspace.member}</option>
                      <option value="admin">{t.workspace.admin}</option>
                    </select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      member.role === "owner" ? "bg-yellow-100 text-yellow-800" :
                      member.role === "admin" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {member.role}
                    </span>
                  )}
                  {currentUserRole === "owner" && member.role !== "owner" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => removeMember(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      {t.delete}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">{t.workspace.rolePermissions}</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">{t.workspace.owner}</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {t.workspace.ownerDesc.split(', ')[0]}</li>
                <li>• {t.workspace.ownerDesc.split(', ')[1]}</li>
                <li>• {t.workspace.ownerDesc.split(', ')[2]}</li>
                <li>• {t.workspace.ownerDesc.split(', ')[3]}</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">{t.workspace.admin}</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {t.workspace.adminDesc.split(', ')[0]}</li>
                <li>• {t.workspace.adminDesc.split(', ')[1]}</li>
                <li>• {t.workspace.adminDesc.split(', ')[2]}</li>
                <li>• {t.workspace.adminDesc.split(', ')[3]}</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">{t.workspace.member}</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {t.workspace.memberDesc.split(', ')[0]}</li>
                <li>• {t.workspace.memberDesc.split(', ')[1]}</li>
                <li>• {t.workspace.memberDesc.split(', ')[2]}</li>
                <li>• {t.workspace.memberDesc.split(', ')[3]}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
