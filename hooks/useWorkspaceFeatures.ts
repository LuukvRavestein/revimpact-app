import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

interface WorkspaceFeature {
  id: string;
  feature_name: string;
  enabled: boolean;
}

export function useWorkspaceFeatures(workspaceId: string | null) {
  const [features, setFeatures] = useState<WorkspaceFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    if (!workspaceId) {
      setFeatures([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadFeatures = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);

        const { data, error: featuresError } = await supabase
          .from('workspace_features')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('enabled', true);

        if (featuresError) {
          console.error('Error loading workspace features:', featuresError);
          if (isMounted) {
            setError('Fout bij laden van workspace features');
          }
          return;
        }

        if (isMounted) {
          setFeatures(data || []);
        }
      } catch (err) {
        console.error('Error loading workspace features:', err);
        if (isMounted) {
          setError('Onverwachte fout bij laden van features');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFeatures();

    // Set up real-time subscription for feature changes (if Realtime is enabled)
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    try {
      channel = supabase
        .channel(`workspace_features:${workspaceId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'workspace_features',
            filter: `workspace_id=eq.${workspaceId}`
          },
          () => {
            console.log('Feature change detected, reloading...');
            // Reload features when any change occurs
            loadFeatures();
          }
        )
        .subscribe();
    } catch (err) {
      console.log('Realtime not available, using fallback refresh mechanism');
    }

    // Fallback: Refresh on window focus (when user switches back to tab)
    const handleFocus = () => {
      if (isMounted) {
        loadFeatures();
      }
    };
    window.addEventListener('focus', handleFocus);

    // Fallback: Periodic refresh every 30 seconds (only when tab is visible)
    const intervalId = setInterval(() => {
      if (isMounted && document.visibilityState === 'visible') {
        loadFeatures();
      }
    }, 30000);

    // Cleanup subscription and event listeners on unmount
    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [supabase, workspaceId]);

  const isFeatureEnabled = (featureName: string): boolean => {
    return features.some(feature => 
      feature.feature_name === featureName && feature.enabled
    );
  };

  return {
    features,
    loading,
    error,
    isFeatureEnabled
  };
}
