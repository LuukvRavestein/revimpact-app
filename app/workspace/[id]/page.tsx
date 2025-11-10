"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import SignOutButton from "@/components/SignOutButton";
import Link from "next/link";
import { isSuperAdmin } from "@/lib/adminUtils";

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

type FeatureDescription = {
  name: string;
  description: string;
  icon: string;
  category?: string;
};

const FEATURE_DESCRIPTIONS: Record<string, FeatureDescription> = {
  data_upload: {
    name: "Data Upload",
    description: "Upload en analyseer klantdata",
    icon: "📊",
    category: "Overig"
  },
  ai_dashboard: {
    name: "AI Dashboard Generator",
    description: "Genereer gepersonaliseerde dashboards met AI",
    icon: "🤖",
    category: "Overig"
  },
  qbr_generator: {
    name: "QBR Generator",
    description: "Genereer Quarterly Business Reviews",
    icon: "📋",
    category: "Overig"
  },
  workspace_settings: {
    name: "Workspace Instellingen",
    description: "Beheer workspace configuratie",
    icon: "⚙️",
    category: "Overig"
  },
  chatbot_analytics: {
    name: "Chatbot Analytics",
    description: "Analyseer chatbot gesprekken",
    icon: "🤖",
    category: "Overig"
  },
  admin_panel: {
    name: "Admin Panel",
    description: "Toegang tot admin functionaliteit",
    icon: "👑",
    category: "Overig"
  },
  academy_monitoring: {
    name: "Academy Dashboard",
    description: "Monitor voortgang van deelnemers in Timewax Academy",
    icon: "🎓",
    category: "Overig"
  },
  // Revenue & Groei Dashboards
  revenue_mrr_arr_trend: {
    name: "MRR / ARR Trend",
    description: "Monthly Recurring Revenue, ARR Growth %, New vs. Lost MRR",
    icon: "📈",
    category: "Revenue & Groei"
  },
  revenue_expansion_contraction: {
    name: "Expansion vs. Contraction",
    description: "% upsell vs. % downgrade - meet groei van bestaande klanten",
    icon: "📊",
    category: "Revenue & Groei"
  },
  revenue_new_business: {
    name: "New Business",
    description: "New MRR per maand, ACV, win rate - stuurt sales en CSM",
    icon: "💼",
    category: "Revenue & Groei"
  },
  revenue_churn_impact: {
    name: "Churn Impact",
    description: "Lost MRR per klant, churn reason - combineert CSM + Finance data",
    icon: "📉",
    category: "Revenue & Groei"
  },
  revenue_forecast: {
    name: "Revenue Forecast",
    description: "Geprojecteerde MRR (pipeline + expansion likelihood)",
    icon: "🔮",
    category: "Revenue & Groei"
  },
  // Retentie & Churn Dashboards
  retention_cohort: {
    name: "Cohort Retention",
    description: "% actieve klanten per cohort (maand van start)",
    icon: "👥",
    category: "Retentie & Churn"
  },
  retention_customer_lifetime: {
    name: "Customer Lifetime",
    description: "Gem. duur klantrelatie, churn-ratio - kern van CLTV-berekening",
    icon: "⏱️",
    category: "Retentie & Churn"
  },
  retention_logo_vs_revenue_churn: {
    name: "Logo vs. Revenue Churn",
    description: "Aantal vs. waarde - toont of je kleine of grote klanten verliest",
    icon: "⚖️",
    category: "Retentie & Churn"
  },
  retention_renewal_health: {
    name: "Renewal Health",
    description: "Renewals per maand, renewal success rate",
    icon: "🔄",
    category: "Retentie & Churn"
  },
  retention_customer_health: {
    name: "Customer Health",
    description: "Composite score: product usage + NPS + open tickets",
    icon: "❤️",
    category: "Retentie & Churn"
  },
  // Onboarding & Activatie Dashboards
  onboarding_time_to_value: {
    name: "Time to Value (TTV)",
    description: "Dagen van start → eerste succesactie",
    icon: "⚡",
    category: "Onboarding & Activatie"
  },
  onboarding_funnel: {
    name: "Onboarding Funnel",
    description: "Aanmeld → eerste project → eerste resultaat",
    icon: "🔄",
    category: "Onboarding & Activatie"
  },
  onboarding_activation_rate: {
    name: "Activation Rate",
    description: "% klanten die binnen 14 dagen waarde zien",
    icon: "✅",
    category: "Onboarding & Activatie"
  },
  onboarding_implementation_progress: {
    name: "Implementation Progress",
    description: "Status per klant, taken voltooid",
    icon: "📋",
    category: "Onboarding & Activatie"
  },
  // Product Usage & Activatie Dashboards
  product_feature_adoption: {
    name: "Feature Adoption",
    description: "Actieve gebruikers per feature - stuurt productontwikkeling",
    icon: "🎯",
    category: "Product Usage"
  },
  product_dau_wau_mau: {
    name: "DAU / WAU / MAU Ratio",
    description: "Dagelijks / Wekelijks / Maandelijks actief - maakt engagement zichtbaar",
    icon: "📊",
    category: "Product Usage"
  },
  product_top_users: {
    name: "Top Users & Accounts",
    description: "Meest actieve gebruikers / klanten - herken ambassadeurs",
    icon: "⭐",
    category: "Product Usage"
  },
  product_usage_frequency: {
    name: "Usage Frequency",
    description: "Aantal logins per week / resource - laat usage gap zien",
    icon: "📈",
    category: "Product Usage"
  },
  product_feature_stickiness: {
    name: "Feature Stickiness",
    description: "% gebruikers dat kernfeatures gebruikt - helpt prioriteiten stellen",
    icon: "🔗",
    category: "Product Usage"
  },
  // Customer Success & NPS Dashboards
  success_nps_sentiment: {
    name: "NPS & Sentiment",
    description: "NPS over tijd, gemiddeld sentiment - toont tevredenheidstrend",
    icon: "😊",
    category: "Customer Success"
  },
  success_support_tickets: {
    name: "Support Tickets",
    description: "Aantal open/gesloten tickets, gemiddelde SLA",
    icon: "🎫",
    category: "Customer Success"
  },
  success_customer_health_csm: {
    name: "Customer Health by CSM",
    description: "Health Score per klant + eigenaar - stuurt prioriteiten",
    icon: "👤",
    category: "Customer Success"
  },
  success_engagement_timeline: {
    name: "Engagement Timeline",
    description: "Interacties per klant (calls, QBRs, mails) - helpt bij renewals",
    icon: "📅",
    category: "Customer Success"
  },
  success_churn_reason_analysis: {
    name: "Churn Reason Analysis",
    description: "Top 5 redenen met impactscore - onderbouwt verbeterinitiatieven",
    icon: "🔍",
    category: "Customer Success"
  },
  // Efficiency & Operationeel Dashboards
  efficiency_revenue_per_employee: {
    name: "Revenue per Employee",
    description: "MRR / aantal FTE - laat groei-efficiëntie zien",
    icon: "💰",
    category: "Efficiency"
  },
  efficiency_support_efficiency: {
    name: "Support Efficiency",
    description: "Tickets per CSM, tijd tot sluiting - meet schaalbaarheid",
    icon: "⚡",
    category: "Efficiency"
  },
  efficiency_cost_per_account: {
    name: "Cost per Account",
    description: "Supporturen per klant / CSM-capaciteit - optimaliseer marge",
    icon: "💵",
    category: "Efficiency"
  },
  efficiency_productivity_per_team: {
    name: "Productivity per Team",
    description: "Output per functie - helpt in resourceplanning",
    icon: "📊",
    category: "Efficiency"
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
        console.error('Members error details:', {
          message: membersError.message,
          details: membersError.details,
          hint: membersError.hint,
          code: membersError.code
        });
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
      // First, get workspace name to check if it's Timewax
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('name')
        .eq('id', workspaceId)
        .single();

      if (workspaceError) {
        console.error('Error loading workspace:', workspaceError);
        setError(`Fout bij laden workspace: ${workspaceError.message}`);
        setFeatures([]);
        return;
      }

      const { data, error } = await supabase
        .from('workspace_features')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('feature_name');

      if (error) {
        console.error('Error loading features:', error);
        // Check if table doesn't exist
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setError('Workspace features tabel bestaat niet. Voer add-academy-feature.sql uit in Supabase.');
        } else {
          setError(`Fout bij laden features: ${error.message}`);
        }
        setFeatures([]);
        return;
      }

      // Get all known features from FEATURE_DESCRIPTIONS
      const allKnownFeatures = Object.keys(FEATURE_DESCRIPTIONS);
      const existingFeatures = data || [];
      const existingFeatureNames = new Set(existingFeatures.map(f => f.feature_name));

      // Create missing features with enabled: false
      const featuresToCreate = allKnownFeatures.filter(featureName => !existingFeatureNames.has(featureName));
      
      if (featuresToCreate.length > 0) {
        const newFeatures = featuresToCreate.map(featureName => ({
          workspace_id: workspaceId,
          feature_name: featureName,
          enabled: false
        }));

        const { error: insertError } = await supabase
          .from('workspace_features')
          .insert(newFeatures);

        if (insertError) {
          console.error('Error creating missing features:', insertError);
        } else {
          console.log(`Created ${featuresToCreate.length} missing features`);
        }
      }

      // If no AI dashboard feature exists, create it with enabled: true (legacy support)
      const hasAIFeature = existingFeatures.some(f => f.feature_name === 'ai_dashboard');
      if (!hasAIFeature && !featuresToCreate.includes('ai_dashboard')) {
        const { error: insertError } = await supabase
          .from('workspace_features')
          .insert({
            workspace_id: workspaceId,
            feature_name: 'ai_dashboard',
            enabled: true
          });
        if (insertError) {
          console.error('Error creating AI feature:', insertError);
        }
      }

      // If this is a Timewax workspace and academy_monitoring doesn't exist, create it with enabled: true
      const workspaceNameLower = workspaceData?.name?.toLowerCase() || '';
      if (workspaceNameLower.includes('timewax')) {
        const hasAcademyFeature = data?.some(f => f.feature_name === 'academy_monitoring');
        if (!hasAcademyFeature) {
          const { error: insertError } = await supabase
            .from('workspace_features')
            .insert({
              workspace_id: workspaceId,
              feature_name: 'academy_monitoring',
              enabled: true
            });
          if (insertError) {
            console.error('Error creating Academy feature:', insertError);
          }
        }
      }

      // Reload features after potential insert
      const { data: updatedData, error: reloadError } = await supabase
        .from('workspace_features')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('feature_name');

      if (reloadError) {
        console.error('Error reloading features:', reloadError);
        setError(`Fout bij herladen features: ${reloadError.message}`);
        // Still set features from initial load if available
        setFeatures(existingFeatures);
        return;
      }

      // Ensure all known features are present (merge with any newly created ones)
      const finalFeatures = updatedData || existingFeatures;
      const finalFeatureNames = new Set(finalFeatures.map(f => f.feature_name));
      
      // Add any still missing features (shouldn't happen, but just in case)
      const stillMissing = allKnownFeatures.filter(f => !finalFeatureNames.has(f));
      if (stillMissing.length > 0) {
        const missingFeatures = stillMissing.map(featureName => ({
          id: `temp-${featureName}`,
          feature_name: featureName,
          enabled: false
        }));
        setFeatures([...finalFeatures, ...missingFeatures]);
      } else {
        setFeatures(finalFeatures);
      }
      
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Error loading features:', err);
      setError(`Onverwachte fout: ${err?.message || 'Onbekende fout'}`);
      setFeatures([]);
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
      const isAdminUser = isSuperAdmin(userEmail);

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
      // If this is a temp feature (not yet in database), create it first
      if (featureId.startsWith('temp-')) {
        const featureName = featureId.replace('temp-', '');
        const { data, error } = await supabase
          .from('workspace_features')
          .insert({
            workspace_id: workspaceId,
            feature_name: featureName,
            enabled
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating feature:', error);
          setError(`Fout bij aanmaken feature: ${error.message}`);
          return;
        }

        setSuccess(`Feature ${enabled ? 'ingeschakeld' : 'uitgeschakeld'}!`);
        await loadFeatures();
        return;
      }

      // Update existing feature
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
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Workspace Features</h2>
            
            {/* Group features by category */}
            {(() => {
              const featuresByCategory = features.reduce((acc, feature) => {
                const featureInfo = FEATURE_DESCRIPTIONS[feature.feature_name as keyof typeof FEATURE_DESCRIPTIONS];
                const category = featureInfo?.category ?? 'Overig';
                if (!acc[category]) {
                  acc[category] = [];
                }
                acc[category].push(feature);
                return acc;
              }, {} as Record<string, typeof features>);

              const categoryOrder = [
                'Revenue & Groei',
                'Retentie & Churn',
                'Onboarding & Activatie',
                'Product Usage',
                'Customer Success',
                'Efficiency',
                'Overig'
              ];

              return (
                <div className="space-y-8">
                  {categoryOrder.map((category) => {
                    const categoryFeatures = featuresByCategory[category];
                    if (!categoryFeatures || categoryFeatures.length === 0) return null;

                    return (
                      <div key={category}>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                          {category}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categoryFeatures.map((feature) => {
                            const featureInfo = FEATURE_DESCRIPTIONS[feature.feature_name as keyof typeof FEATURE_DESCRIPTIONS];
                            
                            // Determine if feature has a link and what URL
                            let hasLink = false;
                            let linkUrl = '';
                            
                            if (feature.feature_name === 'ai_dashboard') {
                              hasLink = true;
                              linkUrl = `/workspace/${workspaceId}/ai`;
                            } else if (feature.feature_name === 'academy_monitoring') {
                              hasLink = true;
                              linkUrl = `/workspace/${workspaceId}/academy`;
                            } else if (feature.feature_name === 'data_upload') {
                              hasLink = true;
                              linkUrl = '/data';
                            } else if (feature.feature_name.startsWith('revenue_')) {
                              hasLink = true;
                              linkUrl = `/workspace/${workspaceId}/revenue`;
                            } else if (feature.feature_name.startsWith('retention_')) {
                              hasLink = true;
                              linkUrl = `/workspace/${workspaceId}/retention`;
                            } else if (feature.feature_name.startsWith('onboarding_')) {
                              hasLink = true;
                              linkUrl = `/workspace/${workspaceId}/onboarding`;
                            } else if (feature.feature_name.startsWith('product_')) {
                              hasLink = true;
                              linkUrl = `/workspace/${workspaceId}/product`;
                            } else if (feature.feature_name.startsWith('success_')) {
                              hasLink = true;
                              linkUrl = `/workspace/${workspaceId}/success`;
                            } else if (feature.feature_name.startsWith('efficiency_')) {
                              hasLink = true;
                              linkUrl = `/workspace/${workspaceId}/efficiency`;
                            }
                            
                            return (
                              <div 
                                key={feature.id} 
                                className={`flex items-start justify-between p-4 rounded-lg transition-all border-2 ${
                                  feature.enabled
                                    ? 'bg-green-50 border-green-200 hover:border-green-300'
                                    : 'bg-gray-50 border-gray-200 hover:border-gray-300 opacity-75'
                                }`}
                              >
                                <div className="flex items-start flex-1">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      {hasLink ? (
                                        <Link 
                                          href={linkUrl}
                                          className="font-medium text-gray-900 hover:text-impact-blue transition-colors"
                                        >
                                          {featureInfo?.name || feature.feature_name}
                                        </Link>
                                      ) : (
                                        <h3 className="font-medium text-gray-900">{featureInfo?.name || feature.feature_name}</h3>
                                      )}
                                      {feature.enabled && (
                                        <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                                          Actief
                                        </span>
                                      )}
                                      {!feature.enabled && (
                                        <span className="px-2 py-0.5 text-xs font-semibold bg-gray-200 text-gray-600 rounded-full">
                                          Uit
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{featureInfo?.description || "Feature beschrijving"}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                                  {hasLink && feature.enabled && (
                                    <Link 
                                      href={linkUrl}
                                      className="px-3 py-1.5 text-sm bg-impact-blue text-white rounded-lg hover:bg-impact-blue/90 transition-colors"
                                    >
                                      Open
                                    </Link>
                                  )}
                                  <label className="relative inline-flex items-center cursor-pointer" title={feature.enabled ? 'Uitschakelen' : 'Inschakelen'}>
                                    <input
                                      type="checkbox"
                                      checked={feature.enabled}
                                      onChange={(e) => toggleFeature(feature.id, e.target.checked)}
                                      className="sr-only peer"
                                    />
                                    <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                                      feature.enabled
                                        ? 'bg-green-500 peer-focus:ring-4 peer-focus:ring-green-200'
                                        : 'bg-gray-300 peer-focus:ring-4 peer-focus:ring-gray-200'
                                    }`}></div>
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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
