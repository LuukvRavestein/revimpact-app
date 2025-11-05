"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import SignOutButton from "@/components/SignOutButton";
import Link from "next/link";
import { useCurrentWorkspace } from "@/hooks/useCurrentWorkspace";
import { useWorkspaceFeatures } from "@/hooks/useWorkspaceFeatures";
import { isSuperAdmin } from "@/lib/adminUtils";
import { useLanguage } from "@/contexts/LanguageContext";

interface Workspace {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export default function WorkspaceViewPage() {
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const supabase = createSupabaseBrowserClient();
  const { t } = useLanguage();
  
  // Use workspace hooks with the specific workspace ID
  const { isFeatureEnabled } = useWorkspaceFeatures(workspaceId);

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          router.push("/signin");
          return;
        }

        // Check if user is super admin
        const userEmail = session.user.email?.toLowerCase() || '';
        const isAdminUser = isSuperAdmin(userEmail);

        if (!isAdminUser) {
          router.push("/dashboard");
          return;
        }

        setIsAdmin(true);

        // Get workspace details
        const { data: workspaceData, error: workspaceError } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', workspaceId)
          .single();

        if (workspaceError) {
          console.error('Error loading workspace:', workspaceError);
          setError('Workspace niet gevonden');
          setLoading(false);
          return;
        }

        setWorkspace(workspaceData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading workspace:', err);
        setError('Onverwachte fout bij laden van workspace');
        setLoading(false);
      }
    };

    loadWorkspace();
  }, [supabase, router, workspaceId]);

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

  if (error || !workspace || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-impact-light via-white to-impact-light flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Toegang Geweigerd</h2>
          <p className="text-gray-600 mb-6">{error || 'Workspace niet gevonden'}</p>
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
                <p className="text-sm text-gray-600">
                  {workspace.name} <span className="text-impact-lime">(Super Admin View)</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href={`/workspace/${workspaceId}`}
                className="text-impact-blue hover:text-impact-blue/80 text-sm font-medium transition-colors"
              >
                ← Workspace Beheer
              </Link>
              <Link 
                href="/revimpact-central"
                className="text-impact-blue hover:text-impact-blue/80 text-sm font-medium transition-colors"
              >
                ← Central
              </Link>
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
            {t.dashboard.workspace}: <span className="font-semibold text-impact-blue">{workspace.name}</span>
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
          
          {isFeatureEnabled('academy_monitoring') && (
            <Link href={`/workspace/${workspaceId}/academy`} className="group">
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
          
          {isFeatureEnabled('ai_dashboard') && (
            <Link href={`/workspace/${workspaceId}/ai`} className="group">
              <div className="bg-white/70 backdrop-blur-sm border-0 shadow-xl shadow-impact-blue/5 rounded-2xl p-6 hover:shadow-2xl hover:shadow-impact-blue/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-impact-blue transition-colors">
                    AI Dashboard Generator
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Genereer gepersonaliseerde dashboards met AI
                </p>
              </div>
            </Link>
          )}
          
          {isFeatureEnabled('workspace_settings') && (
            <Link href={`/workspace/${workspaceId}`} className="group">
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
        </div>
      </main>
    </div>
  );
}

