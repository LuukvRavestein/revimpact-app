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
            role
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
          
          // Get workspace details separately
          const { data: workspaceData, error: workspaceError } = await supabase
            .from('workspaces')
            .select('id, name')
            .eq('id', firstMembership.workspace_id);
          
          console.log('Workspace query result:', workspaceData, 'Error:', workspaceError);
          
          if (workspaceError) {
            console.error('Error loading workspace details:', workspaceError);
          }
          
          const workspace = {
            id: firstMembership.workspace_id,
            name: workspaceData && workspaceData.length > 0 ? workspaceData[0].name : 'Unknown Workspace',
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
