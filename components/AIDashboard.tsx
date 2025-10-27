"use client";

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

interface AIDashboardProps {
  workspaceId: string;
  uploadId: string;
}

interface AnalysisResult {
  id: string;
  analysis_type: string;
  insights: any[];
  recommendations: any[];
  confidence_score: number;
  created_at: string;
}

interface Dashboard {
  id: string;
  dashboard_name: string;
  dashboard_description: string;
  dashboard_config: any;
  created_at: string;
}

export default function AIDashboard({ workspaceId, uploadId }: AIDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [dashboardName, setDashboardName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const supabase = createSupabaseBrowserClient();

  // Load existing analysis results and dashboards
  useEffect(() => {
    loadAnalysisResults();
    loadDashboards();
  }, [workspaceId, uploadId]);

  const loadAnalysisResults = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_analysis_results')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('upload_id', uploadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalysisResults(data || []);
    } catch (err) {
      console.error('Error loading analysis results:', err);
    }
  };

  const loadDashboards = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_generated_dashboards')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDashboards(data || []);
    } catch (err) {
      console.error('Error loading dashboards:', err);
    }
  };

  const runAnalysis = async (analysisType: string) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          uploadId,
          analysisType,
          customPrompt: customPrompt || undefined
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      setSuccess('Analysis completed successfully!');
      setCustomPrompt('');
      await loadAnalysisResults();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const generateDashboard = async () => {
    if (!selectedAnalysis || !dashboardName) {
      setError('Please select an analysis and enter a dashboard name');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/ai/generate-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          analysisId: selectedAnalysis,
          dashboardName
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Dashboard generation failed');
      }

      setSuccess('Dashboard generated successfully!');
      setDashboardName('');
      setSelectedAnalysis('');
      await loadDashboards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dashboard generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Dashboard Generator</h1>
        <p className="text-gray-600">
          Upload your data and let AI create personalized dashboards for your workspace.
        </p>
      </div>

      {/* Analysis Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Data Analysis</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Analysis Types */}
          <div>
            <h3 className="text-lg font-medium mb-3">Analysis Types</h3>
            <div className="space-y-3">
              <button
                onClick={() => runAnalysis('customer_behavior')}
                disabled={loading}
                className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="font-medium">Customer Behavior</div>
                <div className="text-sm text-gray-600">Analyze customer patterns and trends</div>
              </button>
              
              <button
                onClick={() => runAnalysis('revenue_trends')}
                disabled={loading}
                className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="font-medium">Revenue Trends</div>
                <div className="text-sm text-gray-600">Identify revenue patterns and opportunities</div>
              </button>
              
              <button
                onClick={() => runAnalysis('churn_prediction')}
                disabled={loading}
                className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="font-medium">Churn Prediction</div>
                <div className="text-sm text-gray-600">Predict and prevent customer churn</div>
              </button>
            </div>
          </div>

          {/* Custom Analysis */}
          <div>
            <h3 className="text-lg font-medium mb-3">Custom Analysis</h3>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe what you want to analyze..."
              className="w-full p-3 border rounded-lg mb-3 h-24"
            />
            <button
              onClick={() => runAnalysis('custom')}
              disabled={loading || !customPrompt.trim()}
              className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Run Custom Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
          <div className="space-y-4">
            {analysisResults.map((analysis) => (
              <div key={analysis.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium capitalize">{analysis.analysis_type.replace('_', ' ')}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(analysis.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  Confidence: {(analysis.confidence_score * 100).toFixed(1)}%
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Key Insights</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {analysis.insights.slice(0, 3).map((insight, idx) => (
                        <li key={idx}>• {insight.title}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Recommendations</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {analysis.recommendations.slice(0, 3).map((rec, idx) => (
                        <li key={idx}>• {rec.title}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAnalysis(analysis.id)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    selectedAnalysis === analysis.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedAnalysis === analysis.id ? 'Selected' : 'Select for Dashboard'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Generation */}
      {selectedAnalysis && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Generate Dashboard</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Dashboard Name</label>
              <input
                type="text"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="Enter dashboard name..."
                className="w-full p-3 border rounded-lg"
              />
            </div>
            <button
              onClick={generateDashboard}
              disabled={loading || !dashboardName.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Generate Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Generated Dashboards */}
      {dashboards.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Generated Dashboards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboards.map((dashboard) => (
              <div key={dashboard.id} className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">{dashboard.dashboard_name}</h3>
                <p className="text-sm text-gray-600 mb-3">{dashboard.dashboard_description}</p>
                <div className="text-xs text-gray-500 mb-3">
                  Created: {new Date(dashboard.created_at).toLocaleDateString()}
                </div>
                <button className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  View Dashboard
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Processing...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
