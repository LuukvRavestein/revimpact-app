"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import Link from "next/link";

interface WorkspaceMember {
  id: string;
  user_id: string;
  workspace_id: string;
  role: string;
  users: {
    email: string;
  }[];
  workspaces: {
    name: string;
  }[];
}

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserWorkspace, setNewUserWorkspace] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const loadUsers = useCallback(async () => {
    try {
      // Get workspace members and then fetch user data separately
      const { data: members, error: membersError } = await supabase
        .from('workspace_members')
        .select('user_id');
      
      if (membersError) {
        console.error('Error loading workspace members:', membersError);
        return;
      }
      
      // Get unique user IDs
      const userIds = [...new Set(members?.map(m => m.user_id) || [])];
      
      // For now, we'll just show the user IDs since we can't access auth.users directly
      const userList = userIds.map(userId => ({
        id: userId,
        email: 'User data not accessible',
        created_at: 'N/A',
        last_sign_in_at: null
      }));
      
      setUsers(userList);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }, [supabase]);

  const loadWorkspaceMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          id,
          user_id,
          workspace_id,
          role,
          workspaces(name)
        `);
      
      if (error) {
        console.error('Error loading workspace members:', error);
        return;
      }
      
      // Transform data to match expected structure
      const transformedData = data?.map(item => ({
        ...item,
        users: [{ email: 'User data not accessible' }],
        workspaces: Array.isArray(item.workspaces) ? item.workspaces : [item.workspaces]
      })) || [];
      
      setWorkspaceMembers(transformedData);
    } catch (err) {
      console.error('Error loading workspace members:', err);
    }
  }, [supabase]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push("/signin");
        return;
      }

      // Check if user is admin (you can customize this logic)
      // For now, we'll check if the user's email contains 'admin' or is a specific admin email
      const userEmail = session.user.email?.toLowerCase() || '';
      const isAdminUser = userEmail === 'luuk@revimpact.nl' || 
                         userEmail === 'admin@revimpact.nl';

      if (!isAdminUser) {
        router.push("/dashboard");
        return;
      }

      setIsAdmin(true);
      await loadUsers();
      await loadWorkspaceMembers();
      setLoading(false);
    };

    checkAdminAccess();
  }, [supabase, router, loadUsers, loadWorkspaceMembers]);


  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    setError("");
    setSuccess("");

    try {
      // Since we can't use admin API, we'll create a workspace and invite system
      // For now, we'll just create the workspace and show instructions
      
      if (!newUserWorkspace) {
        setError("Workspace naam is verplicht");
        setIsCreatingUser(false);
        return;
      }

      // Create or get workspace
      // If it's a new workspace name, create it
      if (!newUserWorkspace.includes('-')) { // Assuming UUIDs contain dashes
        const { error: workspaceError } = await supabase
          .from('workspaces')
          .insert({ name: newUserWorkspace })
          .select('id')
          .single();

        if (workspaceError) {
          setError(`Fout bij aanmaken workspace: ${workspaceError.message}`);
          setIsCreatingUser(false);
          return;
        }
      }

      setSuccess(`Workspace "${newUserWorkspace}" is aangemaakt! 
      
Om een nieuwe gebruiker aan te maken:
1. Ga naar Supabase Dashboard → Authentication → Users
2. Klik op "Add user" 
3. Voer email in: ${newUserEmail}
4. Voer wachtwoord in: ${newUserPassword}
5. Na aanmaken, voeg de gebruiker toe aan workspace "${newUserWorkspace}"`);
      
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserWorkspace("");
      
      // Reload data
      await loadUsers();
      await loadWorkspaceMembers();
    } catch (err) {
      setError(`Onverwachte fout: ${err}`);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const deleteUser = async (userId: string, user: UserData) => {
    const email = user.email || 'onbekende gebruiker';
    if (!confirm(`Weet je zeker dat je gebruiker ${email} volledig wilt verwijderen?\n\nDit zal de gebruiker permanent verwijderen uit alle workspaces en uit het systeem.`)) {
      return;
    }

    try {
      // Find the workspace member record for this user
      const { data: memberData } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .single();

      const memberId = memberData?.id || userId;

      // Call the delete-user API route
      const response = await fetch('/api/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          memberId: memberId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Fout bij verwijderen gebruiker');
        return;
      }

      setSuccess(result.message || `Gebruiker ${email} succesvol verwijderd!`);
      
      // Reload data
      await loadUsers();
      await loadWorkspaceMembers();
    } catch (err) {
      console.error('Delete user error:', err);
      setError(`Onverwachte fout bij verwijderen: ${err}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Controleren toegang...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Toegang Geweigerd</h2>
          <p className="text-gray-600 mb-6">Alleen administrators hebben toegang tot deze pagina.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Terug naar Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Gebruikersbeheer en systeembeheer</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/revimpact-central"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                🏢 RevImpact Central
              </Link>
              <Link 
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Terug naar Dashboard
              </Link>
              <button
                onClick={() => supabase.auth.signOut().then(() => router.push('/signin'))}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Uitloggen
              </button>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create User Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Workspace Aanmaken + Gebruiker Instructies</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <form onSubmit={createUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-mailadres
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="gebruiker@bedrijf.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Wachtwoord
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Minimaal 6 karakters"
                />
              </div>
              
              <div>
                <label htmlFor="workspace" className="block text-sm font-medium text-gray-700">
                  Workspace
                </label>
                <input
                  type="text"
                  id="workspace"
                  value={newUserWorkspace}
                  onChange={(e) => setNewUserWorkspace(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Workspace naam (optioneel)"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isCreatingUser}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingUser ? "Aanmaken..." : "Workspace Aanmaken + Instructies"}
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Alle Gebruikers ({users.length})</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-mail
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aangemaakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Laatste Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.email || 'Geen e-mail'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString('nl-NL')
                        : 'Nog niet ingelogd'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => deleteUser(user.id, user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Verwijderen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workspace Members */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Workspace Leden ({workspaceMembers.length})</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gebruiker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workspace
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workspaceMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {member.users?.[0]?.email || 'Onbekend'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.workspaces?.[0]?.name || 'Onbekend'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        member.role === 'owner' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
