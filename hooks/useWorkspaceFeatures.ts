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

    const loadFeatures = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: featuresError } = await supabase
          .from('workspace_features')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('enabled', true);

        if (featuresError) {
          console.error('Error loading workspace features:', featuresError);
          setError('Fout bij laden van workspace features');
          return;
        }

        setFeatures(data || []);
      } catch (err) {
        console.error('Error loading workspace features:', err);
        setError('Onverwachte fout bij laden van features');
      } finally {
        setLoading(false);
      }
    };

    loadFeatures();
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
