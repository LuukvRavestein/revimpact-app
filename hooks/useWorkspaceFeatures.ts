import { useState, useEffect, useCallback } from 'react';
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
  const [refreshKey, setRefreshKey] = useState(0);
  const supabase = createSupabaseBrowserClient();
  
  // Expose refresh function
  const refreshFeatures = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

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
        console.log('Loading features for workspace:', workspaceId);
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

        console.log('Loaded features:', data?.length || 0, 'enabled features');
        if (isMounted) {
          setFeatures(data || []);
          console.log('Features state updated:', data?.map(f => f.feature_name) || []);
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

    // Listen for custom event when features are toggled
    const handleFeatureChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail as { workspaceId: string; featureId: string; enabled: boolean; timestamp?: string };
      console.log('Feature change event received:', detail);
      if (detail.workspaceId === workspaceId && isMounted) {
        console.log('Workspace ID matches, reloading features...');
        // Small delay to ensure database is updated
        setTimeout(() => {
          if (isMounted) {
            loadFeatures();
          }
        }, 500);
      } else {
        console.log('Workspace ID mismatch or not mounted:', { detailWorkspaceId: detail.workspaceId, currentWorkspaceId: workspaceId, isMounted });
      }
    };
    window.addEventListener('workspace-feature-changed', handleFeatureChange);

    // Listen for localStorage changes (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `workspace-feature-updated-${workspaceId}` && isMounted) {
        console.log('Feature update detected via localStorage, reloading features...');
        loadFeatures();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Also check localStorage on mount and periodically
    const checkLocalStorage = () => {
      if (!isMounted) return;
      const lastUpdate = localStorage.getItem(`workspace-feature-updated-${workspaceId}`);
      if (lastUpdate) {
        const lastUpdateTime = parseInt(lastUpdate, 10);
        const now = Date.now();
        // If update was within last 10 seconds, reload
        if (now - lastUpdateTime < 10000) {
          console.log('Recent feature update detected, reloading features...');
          loadFeatures();
        }
      }
    };

    // Fallback: Refresh on window focus (when user switches back to tab)
    const handleFocus = () => {
      if (isMounted) {
        checkLocalStorage();
        loadFeatures();
      }
    };
    window.addEventListener('focus', handleFocus);

    // Fallback: Periodic refresh every 2 seconds (only when tab is visible)
    // This ensures we catch changes even if events don't work
    let lastCheckedTimestamp = '';
    const intervalId = setInterval(() => {
      if (isMounted && document.visibilityState === 'visible') {
        const lastUpdate = localStorage.getItem(`workspace-feature-updated-${workspaceId}`);
        if (lastUpdate && lastUpdate !== lastCheckedTimestamp) {
          const lastUpdateTime = parseInt(lastUpdate, 10);
          const now = Date.now();
          // If update was within last 15 seconds, reload
          if (now - lastUpdateTime < 15000) {
            console.log('Periodic check detected feature update, reloading...');
            lastCheckedTimestamp = lastUpdate;
            loadFeatures();
          }
        }
      }
    }, 2000);

    // Initial localStorage check
    checkLocalStorage();

    // Cleanup subscription and event listeners on unmount
    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('workspace-feature-changed', handleFeatureChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [supabase, workspaceId, refreshKey]);

  const isFeatureEnabled = useCallback((featureName: string): boolean => {
    const enabled = features.some(feature => 
      feature.feature_name === featureName && feature.enabled
    );
    console.log(`isFeatureEnabled('${featureName}'):`, enabled, 'from features:', features.map(f => f.feature_name));
    return enabled;
  }, [features]);

  return {
    features,
    loading,
    error,
    isFeatureEnabled,
    refreshFeatures
  };
}
