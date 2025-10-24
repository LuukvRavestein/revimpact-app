"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function InvitePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [invitation, setInvitation] = useState<{
    id: string;
    email: string;
    role: string;
    workspace_id: string;
    workspaces: {
      name: string;
    } | null;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const loadInvitation = async () => {
      try {
        const { data, error } = await supabase
          .from('workspace_invitations')
          .select(`
            *,
            workspaces(name)
          `)
          .eq('token', token)
          .eq('status', 'pending')
          .single();

        if (error) {
          console.error('Error loading invitation:', error);
          setError('Uitnodiging niet gevonden of verlopen');
          setLoading(false);
          return;
        }

        // Check if invitation is expired
        if (new Date(data.expires_at) < new Date()) {
          setError('Deze uitnodiging is verlopen');
          setLoading(false);
          return;
        }

        setInvitation(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading invitation:', err);
        setError('Onverwachte fout bij laden van uitnodiging');
        setLoading(false);
      }
    };

    loadInvitation();
  }, [supabase, token]);

  const acceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAccepting(true);
    setError("");
    setSuccess("");

    try {
      if (!invitation) {
        setError("Uitnodiging niet gevonden");
        setIsAccepting(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Wachtwoorden komen niet overeen");
        setIsAccepting(false);
        return;
      }

      if (password.length < 6) {
        setError("Wachtwoord moet minimaal 6 karakters lang zijn");
        setIsAccepting(false);
        return;
      }

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
      });

      if (authError) {
        console.error('Error creating account:', authError);
        setError(`Fout bij aanmaken account: ${authError.message}`);
        setIsAccepting(false);
        return;
      }

      if (!authData.user) {
        setError("Account kon niet worden aangemaakt");
        setIsAccepting(false);
        return;
      }

      // Add user to workspace
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: invitation.workspace_id,
          user_id: authData.user.id,
          role: invitation.role
        });

      if (memberError) {
        console.error('Error adding to workspace:', memberError);
        setError("Account aangemaakt, maar kon niet worden toegevoegd aan workspace");
        setIsAccepting(false);
        return;
      }

      // Update invitation status
      const { error: updateError } = await supabase
        .from('workspace_invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Error updating invitation:', updateError);
      }

      setSuccess("Account succesvol aangemaakt! Je wordt doorgestuurd naar de inlogpagina.");
      
      // Redirect to signin after 2 seconds
      setTimeout(() => {
        router.push('/signin');
      }, 2000);

    } catch (err) {
      console.error('Unexpected error:', err);
      setError(`Onverwachte fout: ${err}`);
    } finally {
      setIsAccepting(false);
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

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-impact-light via-white to-impact-light flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Uitnodiging Niet Gevonden</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/signin')}
            className="bg-impact-blue text-white px-6 py-2 rounded-lg hover:bg-impact-blue/90 transition-colors"
          >
            Ga naar Inlogpagina
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
                  <h1 className="text-3xl font-bold text-impact-dark">RevImpact</h1>
                  <p className="text-gray-600">Workspace Uitnodiging</p>
                </div>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welkom bij RevImpact!</h2>
            <p className="text-gray-600">
              Je bent uitgenodigd voor workspace: <strong>{invitation?.workspaces?.name}</strong>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Rol: {invitation?.role === 'owner' ? 'Eigenaar' : 'Lid'}
            </p>
          </div>

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

          <form onSubmit={acceptInvitation} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mailadres
              </label>
              <input
                type="email"
                id="email"
                value={invitation?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Wachtwoord
              </label>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors"
                placeholder="Minimaal 6 karakters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Bevestig Wachtwoord
              </label>
              <input
                type="password"
                id="confirmPassword"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors"
                placeholder="Herhaal wachtwoord"
              />
            </div>

            <button
              type="submit"
              disabled={isAccepting}
              className="w-full bg-gradient-to-r from-impact-blue to-impact-blue/90 hover:from-impact-blue/90 hover:to-impact-blue text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAccepting ? "Account Aanmaken..." : "Accepteer Uitnodiging"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Al een account? <button
                onClick={() => router.push('/signin')}
                className="text-impact-blue hover:text-impact-blue/80 font-medium"
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}