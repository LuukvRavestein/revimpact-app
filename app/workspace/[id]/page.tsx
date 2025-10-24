"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
      name?: string;
    } | null;
  }[];
}

interface WorkspaceFeature {
  id: string;
  feature_name: string;
  enabled: boolean;
}


interface WorkspaceInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

const FEATURE_DESCRIPTIONS = {
  data_upload: {
    name: "Data Upload",
    description: "Upload en analyseer klantdata",
    icon: "📊"
  },
  qbr_generator: {
    name: "QBR Generator",
    description: "Genereer Quarterly Business Reviews",
    icon: "📋"
  },
  workspace_settings: {
    name: "Workspace Instellingen",
    description: "Beheer workspace configuratie",
    icon: "⚙️"
  },
  chatbot_analytics: {
    name: "Chatbot Analytics",
    description: "Analyseer chatbot gesprekken",
    icon: "🤖"
  },
  admin_panel: {
    name: "Admin Panel",
    description: "Toegang tot admin functionaliteit",
    icon: "👑"
  }
};

export default function WorkspaceManagementPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [features, setFeatures] = useState<WorkspaceFeature[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [newInviteName, setNewInviteName] = useState("");
  const [newInviteRole, setNewInviteRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  
  // Edit user states
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState("member");
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const supabase = createSupabaseBrowserClient();

  const loadWorkspace = useCallback(async () => {
    try {
      // Get workspace details
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select(`
          id,
          name,
          created_by,
          created_at
        `)
        .eq('id', workspaceId)
        .single();

      if (workspaceError) {
        console.error('Error loading workspace:', workspaceError);
        setError('Workspace niet gevonden');
        return;
      }

      // Get members with user details
      const { data: members, error: membersError } = await supabase
        .from('workspace_members')
        .select(`
          id,
          user_id,
          role,
          user_email,
          user_name
        `)
        .eq('workspace_id', workspaceId);

      if (membersError) {
        console.error('Error loading members:', membersError);
      }

      setWorkspace({
        ...workspaceData,
        member_count: members?.length || 0,
        members: (members || []).map((member) => {
          // Use user data from workspace_members table
          return {
            ...member,
            users: {
              email: member.user_email || 'Unknown User',
              name: member.user_name || 'Unknown User'
            }
          };
        })
      });
    } catch (err) {
      console.error('Error loading workspace:', err);
      setError('Onverwachte fout bij laden van workspace');
    }
  }, [supabase, workspaceId]);

  const loadFeatures = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('workspace_features')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('feature_name');

      if (error) {
        console.error('Error loading features:', error);
        return;
      }

      setFeatures(data || []);
    } catch (err) {
      console.error('Error loading features:', err);
    }
  }, [supabase, workspaceId]);


  const loadInvitations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('workspace_invitations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading invitations:', error);
        return;
      }

      // Filter out accepted invitations and clean up old ones
      const activeInvitations = (data || []).filter(invitation => {
        // Remove accepted invitations
        if (invitation.status === 'accepted') {
          return false;
        }
        
        // Remove expired invitations
        if (new Date(invitation.expires_at) < new Date()) {
          return false;
        }
        
        return true;
      });

      setInvitations(activeInvitations);

      // Clean up old/accepted invitations in background
      if (data && data.length > activeInvitations.length) {
        const toDelete = data.filter(invitation => 
          invitation.status === 'accepted' || new Date(invitation.expires_at) < new Date()
        );
        
        for (const invitation of toDelete) {
          await supabase
            .from('workspace_invitations')
            .delete()
            .eq('id', invitation.id);
        }
      }
    } catch (err) {
      console.error('Error loading invitations:', err);
    }
  }, [supabase, workspaceId]);

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
      await loadWorkspace();
      await loadFeatures();
      await loadInvitations();
      setLoading(false);
    };

    checkAdminAccess();
  }, [supabase, router, loadWorkspace, loadFeatures, loadInvitations]);

  const toggleFeature = async (featureId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('workspace_features')
        .update({ enabled })
        .eq('id', featureId);

      if (error) {
        console.error('Error updating feature:', error);
        setError(`Fout bij bijwerken feature: ${error.message}`);
        return;
      }

      setSuccess(`Feature ${enabled ? 'ingeschakeld' : 'uitgeschakeld'}!`);
      await loadFeatures();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(`Onverwachte fout: ${err}`);
    }
  };

  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setError("");
    setSuccess("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("Geen actieve sessie");
        return;
      }

      // Generate invitation token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const { error } = await supabase
        .from('workspace_invitations')
        .insert({
          workspace_id: workspaceId,
          email: newInviteEmail,
          role: newInviteRole,
          invited_by: session.user.id,
          token,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        console.error('Error sending invitation:', error);
        setError(`Fout bij versturen uitnodiging: ${error.message}`);
        return;
      }

      // Generate invitation URL
      const invitationUrl = `${window.location.origin}/invite/${token}`;
      
      // Send invitation email
      try {
        const emailResponse = await fetch('/api/send-invitation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: newInviteEmail,
            invitationUrl: invitationUrl,
            workspaceName: workspace?.name || 'Workspace',
            role: newInviteRole,
            userName: newInviteName
          }),
        });

        const emailResult = await emailResponse.json();

        if (emailResult.success) {
          setSuccess(`Uitnodiging aangemaakt en per e-mail verstuurd naar ${newInviteEmail}! 
          
De gebruiker heeft een e-mail ontvangen met de uitnodigingslink.`);
        } else {
          setSuccess(`Uitnodiging aangemaakt voor ${newInviteEmail}! 
          
Uitnodigingslink: ${invitationUrl}

E-mail kon niet worden verstuurd. Deel deze link handmatig met de gebruiker.`);
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        setSuccess(`Uitnodiging aangemaakt voor ${newInviteEmail}! 
        
Uitnodigingslink: ${invitationUrl}

E-mail kon niet worden verstuurd. Deel deze link handmatig met de gebruiker.`);
      }
      
      setNewInviteEmail("");
      setNewInviteName("");
      setNewInviteRole("member");
      setShowInviteForm(false);
      await loadInvitations();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(`Onverwachte fout: ${err}`);
    } finally {
      setIsInviting(false);
    }
  };

  const removeMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Weet je zeker dat je ${memberEmail} wilt verwijderen uit deze workspace?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('Error removing member:', error);
        setError(`Fout bij verwijderen lid: ${error.message}`);
        return;
      }

      setSuccess(`${memberEmail} verwijderd uit workspace!`);
      await loadWorkspace();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(`Onverwachte fout: ${err}`);
    }
  };

  const startEditUser = (member: { id: string; user_id: string; role: string; users: { email: string; name?: string } | null }) => {
    setEditingUser(member.id);
    setEditUserName(member.users?.name || '');
    setEditUserEmail(member.users?.email || '');
    setEditUserRole(member.role);
  };

  const cancelEditUser = () => {
    setEditingUser(null);
    setEditUserName('');
    setEditUserEmail('');
    setEditUserRole('member');
  };

  const updateUser = async (memberId: string, userId: string) => {
    try {
      setIsUpdatingUser(true);
      setError('');
      setSuccess('');

      // Update workspace member data
      const { error: memberError } = await supabase
        .from('workspace_members')
        .update({ 
          role: editUserRole,
          user_name: editUserName,
          user_email: editUserEmail
        })
        .eq('id', memberId);

      if (memberError) {
        console.error('Error updating member:', memberError);
        setError('Fout bij bijwerken van gebruiker');
        return;
      }

      // Update user via API route (for auth.users table)
      const response = await fetch('/api/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          memberId,
          name: editUserName,
          email: editUserEmail,
          role: editUserRole
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.log('API update failed, but workspace member updated:', result.message);
        // Don't return error here, as workspace member was updated successfully
      }

      setSuccess('Gebruiker succesvol bijgewerkt');
      setEditingUser(null);
      await loadWorkspace();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(`Onverwachte fout: ${err}`);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const deleteInvitation = async (invitationId: string, email: string) => {
    if (!confirm(`Weet je zeker dat je de uitnodiging voor ${email} wilt verwijderen?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('workspace_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('Error deleting invitation:', error);
        setError(`Fout bij verwijderen uitnodiging: ${error.message}`);
        return;
      }

      setSuccess(`Uitnodiging voor ${email} verwijderd!`);
      await loadInvitations();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(`Onverwachte fout: ${err}`);
    }
  };

  const createUserDirectly = async (email: string, role: string, name?: string) => {
    try {
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: tempPassword,
      });

      if (authError) {
        console.error('Error creating user:', authError);
        setError(`Fout bij aanmaken gebruiker: ${authError.message}`);
        return;
      }

      if (!authData.user) {
        setError("Gebruiker kon niet worden aangemaakt");
        return;
      }

      // Add user to workspace
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: authData.user.id,
          role: role,
          user_email: email,
          user_name: name || email.split('@')[0]
        });

      if (memberError) {
        console.error('Error adding to workspace:', memberError);
        setError("Gebruiker aangemaakt, maar kon niet worden toegevoegd aan workspace");
        return;
      }

      setSuccess(`Gebruiker ${name ? `${name} (${email})` : email} succesvol aangemaakt en toegevoegd aan workspace!
      
Tijdelijk wachtwoord: ${tempPassword}

De gebruiker kan nu inloggen en het wachtwoord wijzigen.`);
      await loadWorkspace();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(`Onverwachte fout: ${err}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-impact-light via-white to-impact-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-impact-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !workspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-impact-light via-white to-impact-light flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Toegang Geweigerd</h2>
          <p className="text-gray-600 mb-6">Alleen administrators hebben toegang tot deze pagina.</p>
          <button
            onClick={() => router.push('/revimpact-central')}
            className="bg-impact-blue text-white px-6 py-2 rounded-lg hover:bg-impact-blue/90 transition-colors"
          >
            Terug naar RevImpact Central
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
                  <h1 className="text-3xl font-bold text-impact-dark">Workspace Beheer</h1>
                  <p className="text-gray-600">{workspace.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/revimpact-central"
                className="text-impact-blue hover:text-impact-blue/80 text-sm font-medium transition-colors"
              >
                ← Terug naar Central
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Features Management */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Workspace Features</h2>
            <div className="space-y-4">
              {features.map((feature) => {
                const featureInfo = FEATURE_DESCRIPTIONS[feature.feature_name as keyof typeof FEATURE_DESCRIPTIONS];
                return (
                  <div key={feature.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{featureInfo?.icon || "🔧"}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{featureInfo?.name || feature.feature_name}</h3>
                        <p className="text-sm text-gray-500">{featureInfo?.description || "Feature beschrijving"}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={feature.enabled}
                        onChange={(e) => toggleFeature(feature.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-impact-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-impact-blue"></div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Members Management */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Gebruikers</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowInviteForm(true)}
                  className="bg-gradient-to-r from-impact-blue to-impact-blue/90 hover:from-impact-blue/90 hover:to-impact-blue text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-impact-blue/20 focus:outline-none"
                >
                  + Uitnodigen
                </button>
                <button
                  onClick={() => setShowInviteForm(true)}
                  className="bg-gradient-to-r from-impact-lime to-impact-lime/90 hover:from-impact-lime/90 hover:to-impact-lime text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-impact-lime/20 focus:outline-none"
                >
                  + Direct Aanmaken
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {workspace.members.map((member) => (
                <div key={member.id} className="p-4 bg-gray-50 rounded-lg">
                  {editingUser === member.id ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Naam
                        </label>
                        <input
                          type="text"
                          value={editUserName}
                          onChange={(e) => setEditUserName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors"
                          placeholder="Volledige naam"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          E-mailadres
                        </label>
                        <input
                          type="email"
                          value={editUserEmail}
                          onChange={(e) => setEditUserEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors"
                          placeholder="gebruiker@bedrijf.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rol
                        </label>
                        <select
                          value={editUserRole}
                          onChange={(e) => setEditUserRole(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors"
                        >
                          <option value="member">Lid</option>
                          <option value="owner">Eigenaar</option>
                        </select>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => updateUser(member.id, member.user_id)}
                          disabled={isUpdatingUser}
                          className="bg-gradient-to-r from-impact-blue to-impact-blue/90 hover:from-impact-blue/90 hover:to-impact-blue text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-impact-blue/20 focus:outline-none disabled:opacity-50"
                        >
                          {isUpdatingUser ? "Bijwerken..." : "Opslaan"}
                        </button>
                        <button
                          onClick={cancelEditUser}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          Annuleren
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-impact-blue rounded-full flex items-center justify-center text-sm text-white font-medium">
                          {(member.users?.name || member.users?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.users?.name || member.users?.email || 'Onbekend'}</p>
                          <p className="text-sm text-gray-500">{member.users?.email} • Rol: {member.role}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditUser(member)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        >
                          Bewerken
                        </button>
                        <button
                          onClick={() => removeMember(member.id, member.users?.name || member.users?.email || 'lid')}
                          className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                        >
                          Verwijderen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Invitations */}
        {invitations.length > 0 && (
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Uitstaande Uitnodigingen</h2>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-sm text-gray-500">
                      Rol: {invitation.role} • Status: {invitation.status} • 
                      Verloopt: {new Date(invitation.expires_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      invitation.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : invitation.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {invitation.status}
                    </span>
                    {invitation.status === 'pending' && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => createUserDirectly(invitation.email, invitation.role)}
                          className="text-green-600 hover:text-green-800 text-xs font-medium transition-colors"
                          title="Maak gebruiker direct aan"
                        >
                          ✓ Aanmaken
                        </button>
                        <button
                          onClick={() => deleteInvitation(invitation.id, invitation.email)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium transition-colors"
                          title="Verwijder uitnodiging"
                        >
                          ✗ Verwijderen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite Form Modal */}
        {showInviteForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lid Uitnodigen</h3>
              
              <form onSubmit={sendInvitation} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Naam (optioneel)
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newInviteName}
                    onChange={(e) => setNewInviteName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors"
                    placeholder="Voornaam Achternaam"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-mailadres
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={newInviteEmail}
                    onChange={(e) => setNewInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors"
                    placeholder="gebruiker@bedrijf.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <select
                    id="role"
                    value={newInviteRole}
                    onChange={(e) => setNewInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors"
                  >
                    <option value="member">Lid</option>
                    <option value="owner">Eigenaar</option>
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="flex-1 bg-gradient-to-r from-impact-blue to-impact-blue/90 hover:from-impact-blue/90 hover:to-impact-blue text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isInviting ? "Uitnodigen..." : "Uitnodigen"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteForm(false);
                      setNewInviteEmail("");
                      setNewInviteName("");
                      setNewInviteRole("member");
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
