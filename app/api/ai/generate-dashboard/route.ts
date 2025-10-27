// Dashboard Generation Service
// Creates AI-powered dashboards based on analysis

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface DashboardGenerationRequest {
  workspaceId: string;
  analysisId: string;
  dashboardName: string;
  customRequirements?: string;
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body: DashboardGenerationRequest = await request.json();
    const { workspaceId, analysisId, dashboardName, customRequirements } = body;

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

    // Get analysis results
    const { data: analysis } = await supabase
      .from('ai_analysis_results')
      .select('*')
      .eq('id', analysisId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Generate dashboard configuration
    const dashboardConfig = await generateDashboardConfig({
      analysis,
      dashboardName,
      customRequirements
    });

    // Create dashboard in database
    const { data: dashboard } = await supabase
      .from('ai_generated_dashboards')
      .insert({
        workspace_id: workspaceId,
        analysis_id: analysisId,
        dashboard_name: dashboardName,
        dashboard_description: dashboardConfig.description,
        dashboard_config: dashboardConfig.config,
        generation_prompt: customRequirements || 'AI-generated dashboard',
        is_active: true
      })
      .select()
      .single();

    // Create dashboard widgets
    for (const widget of dashboardConfig.widgets) {
      await supabase
        .from('dashboard_widgets')
        .insert({
          dashboard_id: dashboard.id,
          widget_type: widget.type,
          widget_title: widget.title,
          widget_config: widget.config,
          data_query: widget.dataQuery,
          position_x: widget.positionX || 0,
          position_y: widget.positionY || 0,
          width: widget.width || 4,
          height: widget.height || 3
        });
    }

    return NextResponse.json({
      success: true,
      dashboard: dashboard,
      widgets: dashboardConfig.widgets
    });

  } catch (error) {
    console.error('Dashboard generation error:', error);
    return NextResponse.json({ 
      error: 'Dashboard generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Generate dashboard configuration using AI
async function generateDashboardConfig({
  analysis,
  dashboardName,
  customRequirements
}: {
  analysis: any;
  dashboardName: string;
  customRequirements?: string;
}) {
  // Create dashboard generation prompt
  const prompt = createDashboardPrompt({
    analysis,
    dashboardName,
    customRequirements
  });

  // Call OpenAI for dashboard generation
  const aiResponse = await callOpenAI(prompt);

  // Parse AI response into dashboard configuration
  return parseDashboardResponse(aiResponse, dashboardName);
}

// Create dashboard generation prompt
function createDashboardPrompt({
  analysis,
  dashboardName,
  customRequirements
}: {
  analysis: any;
  dashboardName: string;
  customRequirements?: string;
}) {
  return `
Create a dashboard configuration for: ${dashboardName}

Analysis Insights:
${JSON.stringify(analysis.insights, null, 2)}

Recommendations:
${JSON.stringify(analysis.recommendations, null, 2)}

${customRequirements ? `Custom Requirements: ${customRequirements}` : ''}

Please provide a JSON configuration with:
1. Dashboard description
2. Widget configurations (charts, metrics, tables)
3. Layout configuration
4. Data queries for each widget

Format as JSON with this structure:
{
  "description": "Dashboard description",
  "config": {
    "layout": { "rows": 3, "cols": 4 },
    "theme": "light"
  },
  "widgets": [
    {
      "type": "chart",
      "title": "Widget Title",
      "config": { "chartType": "line", "dataSource": "customer_records" },
      "dataQuery": "SELECT * FROM customer_records LIMIT 100",
      "positionX": 0,
      "positionY": 0,
      "width": 4,
      "height": 3
    }
  ]
}
`;
}

// Call OpenAI API
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
          content: 'You are a dashboard design expert. Create JSON configurations for data dashboards.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Parse AI response into dashboard configuration
function parseDashboardResponse(response: string, dashboardName: string) {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const config = JSON.parse(jsonMatch[0]);
    
    return {
      description: config.description || `${dashboardName} - AI Generated Dashboard`,
      config: config.config || { layout: { rows: 3, cols: 4 }, theme: 'light' },
      widgets: config.widgets || []
    };
  } catch (error) {
    console.error('Error parsing dashboard response:', error);
    
    // Fallback configuration
    return {
      description: `${dashboardName} - AI Generated Dashboard`,
      config: { layout: { rows: 3, cols: 4 }, theme: 'light' },
      widgets: [
        {
          type: 'metric',
          title: 'Total Records',
          config: { format: 'number' },
          dataQuery: 'SELECT COUNT(*) FROM customer_records',
          positionX: 0,
          positionY: 0,
          width: 4,
          height: 2
        }
      ]
    };
  }
}
