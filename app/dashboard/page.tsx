"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import SignOutButton from "@/components/SignOutButton";

export default function DashboardPage() {
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [clientType, setClientType] = useState<string>("generic");
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { t } = useLanguage();

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
      
      // Check if user is admin
      const userEmail = session.user.email?.toLowerCase() || '';
      const isAdminUser = userEmail.includes('admin') || 
                         userEmail === 'luuk@revimpact.nl' || 
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
      <main className="max-w-3xl mx-auto p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t.loading}</h1>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <SignOutButton />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t.dashboard.welcome}</h1>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <SignOutButton />
        </div>
      </div>
      
      <p className="text-gray-600">
        {t.dashboard.workspace}: <strong>{workspaceName}</strong>
      </p>
      
      <div className="mt-6 space-y-3">
        <div>
          <Link className="underline text-blue-600" href="/data">
            📊 {t.dashboard.uploadData}
          </Link>
        </div>
        <div>
          <Link className="underline text-blue-600" href="/qbr">
            📋 {t.dashboard.qbrGenerator}
          </Link>
        </div>
        {clientType === 'timewax' && (
          <div>
            <Link className="underline text-blue-600" href="/chatbot">
              🤖 Chatbot Analytics
            </Link>
            <p className="text-sm text-gray-500 ml-6">
              Analyseer chatbot gesprekken en verbeter customer support
            </p>
          </div>
        )}
        {isAdmin && (
          <div>
            <Link className="underline text-blue-600" href="/admin">
              👑 Admin Panel
            </Link>
            <p className="text-sm text-gray-500 ml-6">
              Gebruikersbeheer en systeembeheer
            </p>
          </div>
        )}
        {isAdmin && (
          <div>
            <Link className="underline text-blue-600" href="/revimpact-central">
              🏢 RevImpact Central
            </Link>
            <p className="text-sm text-gray-500 ml-6">
              Centraal workspace beheer - alle workspaces overzicht
            </p>
          </div>
        )}
        {clientType === 'admin' && (
          <div>
            <Link className="underline text-blue-600" href="/admin">
              🔧 Admin Access (Workspace Issues)
            </Link>
            <p className="text-sm text-gray-500 ml-6">
              Directe admin toegang ondanks workspace problemen
            </p>
          </div>
        )}
        <div>
          <Link className="underline text-blue-600" href="/workspace">
            ⚙️ {t.dashboard.workspaceSettings}
          </Link>
        </div>
      </div>
    </main>
  );
}
