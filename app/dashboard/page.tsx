"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import SignOutButton from "@/components/SignOutButton";
import { useCurrentWorkspace } from "@/hooks/useCurrentWorkspace";
import { useWorkspaceFeatures } from "@/hooks/useWorkspaceFeatures";

export default function DashboardPage() {
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [clientType, setClientType] = useState<string>("generic");
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { t } = useLanguage();
  
  // Use workspace hooks
  const { workspace: currentWorkspace } = useCurrentWorkspace();
  const { isFeatureEnabled } = useWorkspaceFeatures(currentWorkspace?.id || null);

  useEffect(() => {
    const loadWorkspace = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push("/signin");
        return;
      }

      // Bestaat er al een membership?
      const { data: memberships, error: mErr } = await supabase
        .from("workspace_members")
        .select("workspace_id, role, workspaces(name)")
        .eq("user_id", session.user.id)
        .limit(1);
      
      if (mErr) {
        console.error("Error loading memberships:", mErr);
        setLoading(false);
        return;
      }

      const membership = memberships?.[0] as { 
        workspace_id: string; 
        role: string; 
        workspaces: { name: string }[] | { name: string }
      } | undefined;
      
      const workspaceId = membership?.workspace_id;
      let name: string | undefined;
      
      if (membership?.workspaces) {
        if (Array.isArray(membership.workspaces)) {
          name = membership.workspaces[0]?.name;
        } else {
          name = membership.workspaces.name;
        }
      }

      // Zo niet: maak workspace + membership
      if (!workspaceId) {
        // Try direct workspace creation first
        const { data: ws, error: wErr } = await supabase
          .from("workspaces")
          .insert({ 
            name: "My Workspace", 
            created_by: session.user.id 
          })
          .select("id, name")
          .single();
        
        if (wErr) {
          // If direct creation fails due to RLS, use RPC function
          const { error: altErr } = await supabase.rpc('create_user_workspace', {
            workspace_name: "My Workspace"
          });
          
          if (altErr) {
            console.error("Workspace creation failed:", altErr);
            setLoading(false);
            return;
          }
          
          name = "My Workspace";
        } else {
          const workspace = ws as { id: string; name: string };
          
          const { error: memErr } = await supabase
            .from("workspace_members")
            .insert({ 
              workspace_id: workspace.id, 
              user_id: session.user.id, 
              role: "owner" 
            });
          
          if (memErr) {
            console.error("Error creating membership:", memErr);
            setLoading(false);
            return;
          }

          name = workspace.name;
        }
      }

      setWorkspaceName(name || "My Workspace");
      
      // Detect client type based on workspace name
      const workspaceNameLower = (name || "").toLowerCase();
      if (workspaceNameLower.includes('timewax')) {
        setClientType('timewax');
      } else {
        setClientType('generic');
      }
      
      // Check if user is super admin (only specific emails)
      const userEmail = session.user.email?.toLowerCase() || '';
      const isAdminUser = userEmail === 'luuk@revimpact.nl' || 
                         userEmail === 'admin@revimpact.nl';
      
      setIsAdmin(isAdminUser);
      
      // Special case: if user is admin but workspace creation failed, still allow access
      if (isAdminUser && !name) {
        setWorkspaceName("Admin Workspace");
        setClientType('admin');
      }
      
      setLoading(false);
    };

    loadWorkspace();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-impact-blue/5 via-white to-impact-lime/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-impact-blue to-impact-lime rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">{t.loading}</h1>
        </div>
      </div>
    );
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
                <p className="text-sm text-gray-600">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-impact-blue to-impact-lime rounded-2xl mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.dashboard.welcome}</h1>
          <p className="text-xl text-gray-600 mb-2">
            {t.dashboard.workspace}: <span className="font-semibold text-impact-blue">{workspaceName}</span>
          </p>
          <p className="text-gray-500">Kies een functie om te beginnen</p>
        </div>
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isFeatureEnabled('data_upload') && (
            <Link href="/data" className="group">
              <div className="bg-white/70 backdrop-blur-sm border-0 shadow-xl shadow-impact-blue/5 rounded-2xl p-6 hover:shadow-2xl hover:shadow-impact-blue/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-impact-blue transition-colors">
                    {t.dashboard.uploadData}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Upload en analyseer klantdata
                </p>
              </div>
            </Link>
          )}
          
          {isFeatureEnabled('qbr_generator') && (
            <Link href="/qbr" className="group">
              <div className="bg-white/70 backdrop-blur-sm border-0 shadow-xl shadow-impact-blue/5 rounded-2xl p-6 hover:shadow-2xl hover:shadow-impact-blue/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-impact-blue transition-colors">
                    {t.dashboard.qbrGenerator}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Genereer Quarterly Business Reviews
                </p>
              </div>
            </Link>
          )}
          
          {isFeatureEnabled('chatbot_analytics') && (
            <Link href="/chatbot" className="group">
              <div className="bg-white/70 backdrop-blur-sm border-0 shadow-xl shadow-impact-blue/5 rounded-2xl p-6 hover:shadow-2xl hover:shadow-impact-blue/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-impact-blue transition-colors">
                    Chatbot Analytics
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Analyseer chatbot gesprekken en verbeter customer support
                </p>
              </div>
            </Link>
          )}
          
          {isFeatureEnabled('academy_monitoring') && currentWorkspace && (
            <Link href={`/workspace/${currentWorkspace.id}/academy`} className="group">
              <div className="bg-white/70 backdrop-blur-sm border-0 shadow-xl shadow-impact-blue/5 rounded-2xl p-6 hover:shadow-2xl hover:shadow-impact-blue/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-impact-blue transition-colors">
                    Academy Dashboard
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Monitor voortgang van deelnemers in Timewax Academy
                </p>
              </div>
            </Link>
          )}
          
          {isFeatureEnabled('admin_panel') && (
            <Link href="/admin" className="group">
              <div className="bg-white/70 backdrop-blur-sm border-0 shadow-xl shadow-impact-blue/5 rounded-2xl p-6 hover:shadow-2xl hover:shadow-impact-blue/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-impact-blue transition-colors">
                    Admin Panel
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Gebruikersbeheer en systeembeheer
                </p>
              </div>
            </Link>
          )}
          
          {isFeatureEnabled('workspace_settings') && (currentWorkspace?.role === 'owner' || currentWorkspace?.role === 'admin') && (
            <Link href={`/workspace/${currentWorkspace?.id}`} className="group">
              <div className="bg-white/70 backdrop-blur-sm border-0 shadow-xl shadow-impact-blue/5 rounded-2xl p-6 hover:shadow-2xl hover:shadow-impact-blue/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-impact-blue to-impact-lime rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-impact-blue transition-colors">
                    Workspace Instellingen
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Beheer workspace configuratie
                </p>
              </div>
            </Link>
          )}
          
          {isAdmin && (
            <Link href="/revimpact-central" className="group">
              <div className="bg-white/70 backdrop-blur-sm border-0 shadow-xl shadow-impact-blue/5 rounded-2xl p-6 hover:shadow-2xl hover:shadow-impact-blue/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-impact-blue to-impact-lime rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-impact-blue transition-colors">
                    RevImpact Central
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Centraal workspace beheer - alle workspaces overzicht
                </p>
              </div>
            </Link>
          )}
          
          {clientType === 'admin' && (
            <Link href="/admin" className="group">
              <div className="bg-white/70 backdrop-blur-sm border-0 shadow-xl shadow-impact-blue/5 rounded-2xl p-6 hover:shadow-2xl hover:shadow-impact-blue/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-impact-blue transition-colors">
                    Admin Access (Workspace Issues)
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Directe admin toegang ondanks workspace problemen
                </p>
              </div>
            </Link>
          )}
          
          <Link href="/workspace" className="group">
            <div className="bg-white/70 backdrop-blur-sm border-0 shadow-xl shadow-impact-blue/5 rounded-2xl p-6 hover:shadow-2xl hover:shadow-impact-blue/10 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-impact-blue transition-colors">
                  {t.dashboard.workspaceSettings}
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                Beheer je workspace instellingen
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
