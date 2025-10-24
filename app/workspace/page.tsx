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
    <div className="min-h-screen bg-gradient-to-br from-impact-blue/5 via-white to-impact-lime/5">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-impact-blue to-impact-lime rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RevImpact</h1>
                <p className="text-sm text-gray-600">Workspace Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <Link href="/dashboard">
                <Button variant="outline" className="border-impact-blue/20 text-impact-blue hover:bg-impact-blue/5">
                  ← {t.back} {t.navDashboard}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-impact-blue to-impact-lime rounded-2xl mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welkom bij je workspace</h1>
          <p className="text-xl text-gray-600 mb-2">Workspace: <span className="font-semibold text-impact-blue">{workspace.name}</span></p>
          <p className="text-gray-500">Beheer je team en werk samen aan geweldige projecten</p>
        </div>

        {/* Workspace Info */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl shadow-impact-blue/5">
          <CardHeader className="bg-gradient-to-r from-impact-blue/5 to-impact-lime/5 border-b border-gray-200/50">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-impact-blue to-impact-lime rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {t.workspace.workspaceInfo}
            </h2>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700">{t.workspace.workspaceName}</label>
                <div className="p-4 bg-gradient-to-r from-impact-blue/5 to-impact-lime/5 rounded-lg border border-impact-blue/10">
                  <span className="text-lg font-semibold text-impact-blue">{workspace.name}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700">{t.workspace.created}</label>
                <div className="p-4 bg-gradient-to-r from-impact-blue/5 to-impact-lime/5 rounded-lg border border-impact-blue/10">
                  <span className="text-lg font-semibold text-gray-700">{new Date(workspace.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invite Users */}
        {currentUserRole === "owner" && (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl shadow-impact-blue/5">
            <CardHeader className="bg-gradient-to-r from-impact-blue/5 to-impact-lime/5 border-b border-gray-200/50">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-impact-blue to-impact-lime rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                {t.workspace.inviteTeam}
              </h2>
              <p className="text-gray-600 mt-2">{t.workspace.inviteSubtitle}</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Input
                  type="email"
                  placeholder={t.workspace.emailPlaceholder}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 border-impact-blue/20 focus:border-impact-blue focus:ring-impact-blue/20"
                />
                <Button 
                  onClick={inviteUser}
                  disabled={isInviting || !inviteEmail}
                  className="bg-gradient-to-r from-impact-blue to-impact-lime hover:from-impact-blue/90 hover:to-impact-lime/90 text-white px-8"
                >
                  {isInviting ? t.workspace.sending : t.workspace.sendInvite}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl shadow-impact-blue/5">
          <CardHeader className="bg-gradient-to-r from-impact-blue/5 to-impact-lime/5 border-b border-gray-200/50">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-impact-blue to-impact-lime rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              {t.workspace.teamMembers}
            </h2>
            <p className="text-gray-600 mt-2">{members.length} {t.workspace.membersCount}{members.length !== 1 ? 's' : ''}</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-white to-gray-50/50 border border-gray-200/50 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-impact-blue to-impact-lime rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {member.user_email?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{member.user_email || "Unknown User"}</p>
                      <p className="text-sm text-gray-500">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {currentUserRole === "owner" && member.role !== "owner" ? (
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole(member.id, e.target.value)}
                        className="p-3 border border-impact-blue/20 rounded-lg focus:border-impact-blue focus:ring-impact-blue/20 bg-white"
                      >
                        <option value="member">{t.workspace.member}</option>
                        <option value="admin">{t.workspace.admin}</option>
                      </select>
                    ) : (
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                        member.role === "owner" ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800" :
                        member.role === "admin" ? "bg-gradient-to-r from-impact-blue/10 to-impact-lime/10 text-impact-blue" :
                        "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800"
                      }`}>
                        {member.role}
                      </span>
                    )}
                    {currentUserRole === "owner" && member.role !== "owner" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMember(member.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
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
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl shadow-impact-blue/5">
          <CardHeader className="bg-gradient-to-r from-impact-blue/5 to-impact-lime/5 border-b border-gray-200/50">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-impact-blue to-impact-lime rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              {t.workspace.rolePermissions}
            </h2>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100/50 border border-yellow-200/50 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">{t.workspace.owner}</h3>
                </div>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-center">• {t.workspace.ownerDesc.split(', ')[0]}</li>
                  <li className="flex items-center">• {t.workspace.ownerDesc.split(', ')[1]}</li>
                  <li className="flex items-center">• {t.workspace.ownerDesc.split(', ')[2]}</li>
                  <li className="flex items-center">• {t.workspace.ownerDesc.split(', ')[3]}</li>
                </ul>
              </div>
              <div className="p-6 bg-gradient-to-br from-impact-blue/5 to-impact-lime/5 border border-impact-blue/20 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-impact-blue to-impact-lime rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">{t.workspace.admin}</h3>
                </div>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-center">• {t.workspace.adminDesc.split(', ')[0]}</li>
                  <li className="flex items-center">• {t.workspace.adminDesc.split(', ')[1]}</li>
                  <li className="flex items-center">• {t.workspace.adminDesc.split(', ')[2]}</li>
                  <li className="flex items-center">• {t.workspace.adminDesc.split(', ')[3]}</li>
                </ul>
              </div>
              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/50 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">{t.workspace.member}</h3>
                </div>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-center">• {t.workspace.memberDesc.split(', ')[0]}</li>
                  <li className="flex items-center">• {t.workspace.memberDesc.split(', ')[1]}</li>
                  <li className="flex items-center">• {t.workspace.memberDesc.split(', ')[2]}</li>
                  <li className="flex items-center">• {t.workspace.memberDesc.split(', ')[3]}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
