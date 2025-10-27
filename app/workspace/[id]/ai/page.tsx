"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import SignOutButton from '@/components/SignOutButton';
import Link from 'next/link';
import AIDashboard from '@/components/AIDashboard';

interface Workspace {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface CustomerDataUpload {
  id: string;
  filename: string;
  file_type: string;
  upload_date: string;
  status: string;
}

export default function WorkspaceAIPage() {
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [uploads, setUploads] = useState<CustomerDataUpload[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<string>('');
  const [error, setError] = useState('');
  
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceId, loadWorkspaceData]);

  const loadWorkspaceData = useCallback(async () => {
    try {
      // Check if user has access to workspace
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/signin');
        return;
      }

      // Get workspace info
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (workspaceError) throw workspaceError;
      setWorkspace(workspaceData);

      // Check workspace membership
      const { data: membership, error: membershipError } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', session.user.id)
        .single();

      if (membershipError || !membership) {
        router.push('/workspace');
        return;
      }

      // Load customer data uploads
      const { data: uploadsData, error: uploadsError } = await supabase
        .from('customer_data_uploads')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('upload_date', { ascending: false });

      if (uploadsError) throw uploadsError;
      setUploads(uploadsData || []);

      setLoading(false);
    } catch (err) {
      console.error('Error loading workspace data:', err);
      setError('Fout bij laden van workspace data');
      setLoading(false);
    }
  }, [supabase, router, workspaceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-impact-blue/5 via-white to-impact-lime/5">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-impact-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Laden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-impact-blue/5 via-white to-impact-lime/5">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">⚠️</div>
            <p className="text-gray-600">{error}</p>
            <Link 
              href="/workspace" 
              className="text-impact-blue hover:text-impact-blue/80 mt-4 inline-block"
            >
              Terug naar Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-impact-blue/5 via-white to-impact-lime/5">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-impact-blue to-impact-lime rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🤖</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-impact-dark">AI Dashboard Generator</h1>
                  <p className="text-gray-600">{workspace?.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href={`/workspace/${workspaceId}`}
                className="text-impact-blue hover:text-impact-blue/80 text-sm font-medium transition-colors"
              >
                ← Terug naar Workspace
              </Link>
              <LanguageSwitcher />
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {uploads.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-impact-blue to-impact-lime rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-3xl">📊</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Geen Data Geüpload</h2>
            <p className="text-gray-600 mb-6">
              Upload eerst klantdata om AI-powered dashboards te genereren.
            </p>
            <Link 
              href="/data"
              className="inline-flex items-center px-6 py-3 bg-impact-blue text-white rounded-lg hover:bg-impact-blue/90 transition-colors"
            >
              Upload Data
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Data Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Selecteer Data voor AI Analyse</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploads.map((upload) => (
                  <div 
                    key={upload.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedUpload === upload.id
                        ? 'border-impact-blue bg-impact-blue/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedUpload(upload.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{upload.filename}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        upload.status === 'processed' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {upload.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {upload.file_type.toUpperCase()} • {new Date(upload.upload_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Dashboard Component */}
            {selectedUpload && (
              <AIDashboard 
                workspaceId={workspaceId} 
                uploadId={selectedUpload} 
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
