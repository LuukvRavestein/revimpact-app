"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import Link from "next/link";

interface User {
  id: string;
  email: string | undefined;
  created_at: string;
  last_sign_in_at: string | null;
}

interface WorkspaceMember {
  id: string;
  user_id: string;
  workspace_id: string;
  role: string;
  users: {
    email: string;
  };
  workspaces: {
    name: string;
  };
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserWorkspace, setNewUserWorkspace] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data, error } = await supabase.auth.admin.listUsers();
        if (error) {
          console.error('Error loading users:', error);
          return;
        }
        setUsers(data.users || []);
      } catch (err) {
        console.error('Error loading users:', err);
      }
    };

    const loadWorkspaceMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('workspace_members')
          .select(`
            id,
            user_id,
            workspace_id,
            role,
            users(email),
            workspaces(name)
          `);
        
        if (error) {
          console.error('Error loading workspace members:', error);
          return;
        }
        setWorkspaceMembers(data || []);
      } catch (err) {
        console.error('Error loading workspace members:', err);
      }
    };

    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push("/signin");
        return;
      }

      // Check if user is admin (you can customize this logic)
      // For now, we'll check if the user's email contains 'admin' or is a specific admin email
      const userEmail = session.user.email?.toLowerCase() || '';
      const isAdminUser = userEmail.includes('admin') || 
                         userEmail === 'luuk@revimpact.nl' || 
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
  }, [supabase, router]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.error('Error loading users:', error);
        return;
      }
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadWorkspaceMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          id,
          user_id,
          workspace_id,
          role,
          users(email),
          workspaces(name)
        `);
      
      if (error) {
        console.error('Error loading workspace members:', error);
        return;
      }
      setWorkspaceMembers(data || []);
    } catch (err) {
      console.error('Error loading workspace members:', err);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    setError("");
    setSuccess("");

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true
      });

      if (authError) {
        setError(`Fout bij aanmaken gebruiker: ${authError.message}`);
        setIsCreatingUser(false);
        return;
      }

      // If workspace is specified, add user to workspace
      if (newUserWorkspace && authData.user) {
        // First, get or create the workspace
        let workspaceId = newUserWorkspace;
        
        // If it's a new workspace name, create it
        if (!newUserWorkspace.includes('-')) { // Assuming UUIDs contain dashes
          const { data: workspaceData, error: workspaceError } = await supabase
            .from('workspaces')
            .insert({ name: newUserWorkspace })
            .select('id')
            .single();

          if (workspaceError) {
            console.error('Error creating workspace:', workspaceError);
          } else {
            workspaceId = workspaceData.id;
          }
        }

        // Add user to workspace
        const { error: memberError } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: workspaceId,
            user_id: authData.user.id,
            role: 'member'
          });

        if (memberError) {
          console.error('Error adding user to workspace:', memberError);
        }
      }

      setSuccess(`Gebruiker ${newUserEmail} succesvol aangemaakt!`);
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

  const deleteUser = async (userId: string, userEmail: string | undefined) => {
    const email = userEmail || 'onbekende gebruiker';
    if (!confirm(`Weet je zeker dat je gebruiker ${email} wilt verwijderen?`)) {
      return;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        setError(`Fout bij verwijderen gebruiker: ${error.message}`);
        return;
      }

      setSuccess(`Gebruiker ${email} succesvol verwijderd!`);
      await loadUsers();
      await loadWorkspaceMembers();
    } catch (err) {
      setError(`Onverwachte fout: ${err}`);
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Nieuwe Gebruiker Aanmaken</h2>
          
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
              {isCreatingUser ? "Aanmaken..." : "Gebruiker Aanmaken"}
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
                        onClick={() => deleteUser(user.id, user.email)}
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
                      {member.users?.email || 'Onbekend'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.workspaces?.name || 'Onbekend'}
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
