// AI Service - Privacy-First Implementation
// No customer data sent to external APIs

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface AIAnalysisRequest {
  workspaceId: string;
  uploadId: string;
  analysisType: string;
  customPrompt?: string;
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body: AIAnalysisRequest = await request.json();
    const { workspaceId, uploadId, analysisType, customPrompt } = body;

    // Verify user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', session.user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get data summary (metadata only, not actual customer data)
    const dataSummary = await getDataSummary(supabase, uploadId);
    
    // Get workspace AI agent context
    const aiAgent = await getWorkspaceAIAgent(supabase, workspaceId);
    
    // Perform AI analysis (privacy-first)
    const analysisResult = await performAIAnalysis({
      dataSummary,
      aiAgent,
      analysisType,
      customPrompt
    });

    // Save analysis result
    const { data: savedAnalysis } = await supabase
      .from('ai_analysis_results')
      .insert({
        workspace_id: workspaceId,
        upload_id: uploadId,
        analysis_type: analysisType,
        analysis_prompt: customPrompt || getDefaultPrompt(analysisType),
        insights: analysisResult.insights,
        recommendations: analysisResult.recommendations,
        confidence_score: analysisResult.confidenceScore,
        processing_time_ms: analysisResult.processingTime
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      analysis: savedAnalysis,
      insights: analysisResult.insights,
      recommendations: analysisResult.recommendations,
      dashboardSuggestions: analysisResult.dashboardSuggestions
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    return NextResponse.json({ 
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get data summary without exposing actual customer data
async function getDataSummary(supabase: unknown, uploadId: string) {
  // Get upload metadata
  const { data: upload } = await supabase
    .from('customer_data_uploads')
    .select('filename, file_type, file_size')
    .eq('id', uploadId)
    .single();

  // Get column mappings
  const { data: mappings } = await supabase
    .from('column_mappings')
    .select('original_column_name, mapped_field, data_type')
    .eq('upload_id', uploadId);

  // Get sample data (limited to 10 records for analysis)
  const { data: sampleRecords } = await supabase
    .from('customer_records')
    .select('*')
    .eq('upload_id', uploadId)
    .limit(10);

  // Get total count
  const { count } = await supabase
    .from('customer_records')
    .select('*', { count: 'exact', head: true })
    .eq('upload_id', uploadId);

  return {
    totalRecords: count || 0,
    columns: mappings || [],
    sampleData: sampleRecords || [],
    uploadInfo: upload
  };
}

// Get or create workspace AI agent
async function getWorkspaceAIAgent(supabase: unknown, workspaceId: string) {
  let { data: agent } = await supabase
    .from('workspace_ai_agents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();

  if (!agent) {
    // Create default AI agent for workspace
    const { data: newAgent } = await supabase
      .from('workspace_ai_agents')
      .insert({
        workspace_id: workspaceId,
        agent_name: 'AI Assistant',
        agent_personality: 'Professional and data-driven',
        custom_prompts: [],
        is_active: true
      })
      .select()
      .single();
    
    agent = newAgent;
  }

  return agent;
}

// Perform AI analysis using local processing + OpenAI API (metadata only)
async function performAIAnalysis({
  dataSummary,
  aiAgent,
  analysisType,
  customPrompt
}: {
  dataSummary: unknown;
  aiAgent: unknown;
  analysisType: string;
  customPrompt?: string;
}) {
  // Create analysis prompt (no actual customer data)
  const analysisPrompt = createAnalysisPrompt({
    dataSummary,
    aiAgent,
    analysisType,
    customPrompt
  });

  // Call OpenAI API with metadata only
  const openaiResponse = await callOpenAI(analysisPrompt);

  // Process response and create structured results
  return processAIResponse(openaiResponse, analysisType);
}

// Create analysis prompt without customer data
function createAnalysisPrompt({
  dataSummary,
  aiAgent,
  analysisType,
  customPrompt
}: {
  dataSummary: unknown;
  aiAgent: unknown;
  analysisType: string;
  customPrompt?: string;
}) {
  const basePrompt = `
You are an AI data analyst assistant for ${aiAgent.agent_name}.
Your personality: ${aiAgent.agent_personality}

Data Summary:
- Total records: ${dataSummary.totalRecords}
- Columns: ${dataSummary.columns.map((c: unknown) => c.mapped_field).join(', ')}
- File type: ${dataSummary.uploadInfo.file_type}

Analysis Type: ${analysisType}

${customPrompt ? `Custom Analysis Request: ${customPrompt}` : ''}

Please provide:
1. Key insights from the data structure
2. Recommendations for dashboard creation
3. Suggested dashboard layouts
4. Confidence score (0-1)

IMPORTANT: Do not request or analyze actual customer data. Work only with the metadata provided.
`;

  return basePrompt;
}

// Call OpenAI API (privacy-safe)
async function callOpenAI(prompt: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional data analyst. Provide structured, actionable insights based on data metadata only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Process AI response into structured format
function processAIResponse(response: string, _analysisType: string) {
  // Parse AI response and structure it
  // This would parse the text response and create structured insights
  
  return {
    insights: [
      {
        type: 'pattern' as const,
        title: 'Data Structure Analysis',
        description: 'Analysis of data patterns based on metadata',
        dataPoints: [],
        significance: 'medium' as const
      }
    ],
    recommendations: [
      {
        category: 'action' as const,
        title: 'Create Customer Dashboard',
        description: 'Based on data structure, create a customer overview dashboard',
        priority: 'high' as const,
        estimatedImpact: 'High visibility into customer data'
      }
    ],
    dashboardSuggestions: [
      {
        name: 'Customer Overview',
        description: 'Main customer metrics dashboard',
        widgets: [
          {
            type: 'metric' as const,
            title: 'Total Customers',
            dataQuery: 'SELECT COUNT(*) FROM customer_records',
            config: { format: 'number' }
          }
        ],
        layout: { rows: 2, cols: 2 }
      }
    ],
    confidenceScore: 0.8,
    processingTime: Date.now()
  };
}

// Get default prompt for analysis type
function getDefaultPrompt(analysisType: string): string {
  const prompts = {
    customer_behavior: 'Analyze customer behavior patterns and trends',
    revenue_trends: 'Analyze revenue patterns and growth opportunities',
    churn_prediction: 'Identify churn risk factors and prevention strategies',
    custom: 'Provide custom analysis based on user requirements'
  };
  
  return prompts[analysisType as keyof typeof prompts] || 'General data analysis';
}
