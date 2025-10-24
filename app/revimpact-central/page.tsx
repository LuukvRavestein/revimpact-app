"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import SignOutButton from "@/components/SignOutButton";
import Link from "next/link";

interface Workspace {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  member_count: number;
  members: {
    id: string;
    user_id: string;
    role: string;
    users: {
      email: string;
    } | null;
  }[];
}

interface WorkspaceMember {
  id: string;
  user_id: string;
  workspace_id: string;
  role: string;
  users: {
    email: string;
  } | null;
}

export default function RevImpactCentralPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [editWorkspaceName, setEditWorkspaceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const loadWorkspaces = useCallback(async () => {
    try {
      // Get all workspaces with member count
      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspaces')
        .select(`
          id,
          name,
          created_by,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (workspacesError) {
        console.error('Error loading workspaces:', workspacesError);
        setError('Fout bij laden van workspaces');
        return;
      }

      // Get member counts and details for each workspace
      const workspacesWithMembers = await Promise.all(
        (workspacesData || []).map(async (workspace) => {
          const { data: members, error: membersError } = await supabase
            .from('workspace_members')
            .select(`
              id,
              user_id,
              role,
              users(email)
            `)
            .eq('workspace_id', workspace.id);

          if (membersError) {
            console.error('Error loading members for workspace:', workspace.id, membersError);
          }

          return {
            ...workspace,
            member_count: members?.length || 0,
            members: members || []
          };
        })
      );

      setWorkspaces(workspacesWithMembers);
    } catch (err) {
      console.error('Error loading workspaces:', err);
      setError('Onverwachte fout bij laden van workspaces');
    }
  }, [supabase]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push("/signin");
        return;
      }

      // Check if user is admin
      const userEmail = session.user.email?.toLowerCase() || '';
      const isAdminUser = userEmail.includes('admin') || 
                         userEmail === 'luuk@revimpact.nl' || 
                         userEmail === 'admin@revimpact.nl';

      if (!isAdminUser) {
        router.push("/dashboard");
        return;
      }

      setIsAdmin(true);
      await loadWorkspaces();
      setLoading(false);
    };

    checkAdminAccess();
  }, [supabase, router, loadWorkspaces]);

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");
    setSuccess("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("Geen actieve sessie");
        return;
      }

      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name: newWorkspaceName,
          created_by: session.user.id
        })
        .select('id')
        .single();

      if (error) {
        setError(`Fout bij aanmaken workspace: ${error.message}`);
        return;
      }

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: data.id,
          user_id: session.user.id,
          role: 'owner'
        });

      if (memberError) {
        console.error('Error adding creator as member:', memberError);
      }

      setSuccess(`Workspace "${newWorkspaceName}" is succesvol aangemaakt!`);
      setNewWorkspaceName("");
      setShowCreateForm(false);
      await loadWorkspaces();
    } catch (err) {
      setError(`Onverwachte fout: ${err}`);
    } finally {
      setIsCreating(false);
    }
  };

  const updateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace) return;

    setIsUpdating(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ name: editWorkspaceName })
        .eq('id', selectedWorkspace.id);

      if (error) {
        setError(`Fout bij bijwerken workspace: ${error.message}`);
        return;
      }

      setSuccess(`Workspace is succesvol bijgewerkt naar "${editWorkspaceName}"!`);
      setShowEditForm(false);
      setSelectedWorkspace(null);
      await loadWorkspaces();
    } catch (err) {
      setError(`Onverwachte fout: ${err}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteWorkspace = async (workspace: Workspace) => {
    if (!confirm(`Weet je zeker dat je workspace "${workspace.name}" wilt verwijderen?\n\nDit zal alle data en leden van deze workspace permanent verwijderen!`)) {
      return;
    }

    setIsDeleting(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspace.id);

      if (error) {
        setError(`Fout bij verwijderen workspace: ${error.message}`);
        return;
      }

      setSuccess(`Workspace "${workspace.name}" is succesvol verwijderd!`);
      await loadWorkspaces();
    } catch (err) {
      setError(`Onverwachte fout bij verwijderen: ${err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditForm = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setEditWorkspaceName(workspace.name);
    setShowEditForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-impact-light via-white to-impact-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-impact-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Controleren toegang...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-impact-light via-white to-impact-light flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Toegang Geweigerd</h2>
          <p className="text-gray-600 mb-6">Alleen administrators hebben toegang tot RevImpact Central.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-impact-blue text-white px-6 py-2 rounded-lg hover:bg-impact-blue/90 transition-colors"
          >
            Terug naar Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-impact-light via-white to-impact-light">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-impact-blue to-impact-lime rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">R</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-impact-dark">RevImpact Central</h1>
                  <p className="text-gray-600">Centraal workspace beheer</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="text-impact-blue hover:text-impact-blue/80 text-sm font-medium transition-colors"
              >
                ← Terug naar Dashboard
              </Link>
              <LanguageSwitcher />
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Workspace Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-impact-blue/10 rounded-lg">
                <svg className="w-6 h-6 text-impact-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totaal Workspaces</p>
                <p className="text-2xl font-bold text-gray-900">{workspaces.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-impact-lime/10 rounded-lg">
                <svg className="w-6 h-6 text-impact-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totaal Leden</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workspaces.reduce((sum, ws) => sum + ws.member_count, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Actieve Workspaces</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workspaces.filter(ws => ws.member_count > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Workspace Overzicht</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-impact-blue to-impact-blue/90 hover:from-impact-blue/90 hover:to-impact-blue text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-impact-blue/20 focus:outline-none"
          >
            + Nieuwe Workspace
          </button>
        </div>

        {/* Workspaces Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workspace
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aangemaakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-200">
                {workspaces.map((workspace) => (
                  <tr key={workspace.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{workspace.name}</div>
                        <div className="text-sm text-gray-500">ID: {workspace.id.slice(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">{workspace.member_count}</span>
                        {workspace.member_count > 0 && (
                          <div className="ml-2 flex -space-x-1">
                            {workspace.members.slice(0, 3).map((member, index) => (
                              <div
                                key={member.id}
                                className="w-6 h-6 bg-impact-blue rounded-full flex items-center justify-center text-xs text-white font-medium"
                                title={member.users?.email || 'Onbekend'}
                              >
                                {member.users?.email?.charAt(0).toUpperCase() || '?'}
                              </div>
                            ))}
                            {workspace.member_count > 3 && (
                              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs text-gray-600 font-medium">
                                +{workspace.member_count - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(workspace.created_at).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditForm(workspace)}
                          className="text-impact-blue hover:text-impact-blue/80 font-medium transition-colors"
                        >
                          Bewerken
                        </button>
                        <button
                          onClick={() => deleteWorkspace(workspace)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50"
                        >
                          Verwijderen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Workspace Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nieuwe Workspace Aanmaken</h3>
              
              <form onSubmit={createWorkspace} className="space-y-4">
                <div>
                  <label htmlFor="workspaceName" className="block text-sm font-medium text-gray-700 mb-2">
                    Workspace Naam
                  </label>
                  <input
                    type="text"
                    id="workspaceName"
                    required
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors"
                    placeholder="Bijv. Bedrijf ABC"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 bg-gradient-to-r from-impact-blue to-impact-blue/90 hover:from-impact-blue/90 hover:to-impact-blue text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? "Aanmaken..." : "Aanmaken"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewWorkspaceName("");
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Workspace Modal */}
        {showEditForm && selectedWorkspace && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Workspace Bewerken</h3>
              
              <form onSubmit={updateWorkspace} className="space-y-4">
                <div>
                  <label htmlFor="editWorkspaceName" className="block text-sm font-medium text-gray-700 mb-2">
                    Workspace Naam
                  </label>
                  <input
                    type="text"
                    id="editWorkspaceName"
                    required
                    value={editWorkspaceName}
                    onChange={(e) => setEditWorkspaceName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors"
                    placeholder="Bijv. Bedrijf ABC"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 bg-gradient-to-r from-impact-blue to-impact-blue/90 hover:from-impact-blue/90 hover:to-impact-blue text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? "Bijwerken..." : "Bijwerken"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setSelectedWorkspace(null);
                      setEditWorkspaceName("");
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
