import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

interface Workspace {
  id: string;
  name: string;
  role: string;
}

export function useCurrentWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const loadCurrentWorkspace = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setWorkspace(null);
          setLoading(false);
          return;
        }

        // Get user's workspace memberships
        const { data: memberships, error: membershipsError } = await supabase
          .from('workspace_members')
          .select(`
            workspace_id,
            role,
            workspaces(id, name)
          `)
          .eq('user_id', session.user.id);

        if (membershipsError) {
          console.error('Error loading workspace memberships:', membershipsError);
          setError('Fout bij laden van workspace');
          return;
        }

        console.log('Loaded workspace memberships:', memberships);
        
        // For now, use the first workspace (you can implement workspace switching later)
        if (memberships && memberships.length > 0) {
          const firstMembership = memberships[0];
          const workspaceData = Array.isArray(firstMembership.workspaces) 
            ? firstMembership.workspaces[0] 
            : firstMembership.workspaces;
          
          const workspace = {
            id: firstMembership.workspace_id,
            name: workspaceData?.name || 'Unknown Workspace',
            role: firstMembership.role
          };
          
          console.log('Setting current workspace:', workspace);
          setWorkspace(workspace);
        } else {
          console.log('No workspace memberships found');
          setWorkspace(null);
        }
      } catch (err) {
        console.error('Error loading current workspace:', err);
        setError('Onverwachte fout bij laden van workspace');
      } finally {
        setLoading(false);
      }
    };

    loadCurrentWorkspace();
  }, [supabase]);

  return {
    workspace,
    loading,
    error
  };
}
