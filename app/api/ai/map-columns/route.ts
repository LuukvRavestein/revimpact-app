import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { isSuperAdmin } from '@/lib/adminUtils';

interface ColumnMappingRequest {
  headers: string[];
  sampleRows: string[][];
  workspaceId: string;
}

interface MappingSuggestion {
  originalColumn: string;
  suggestedField: string;
  confidence: number;
  reasoning: string;
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body: ColumnMappingRequest = await request.json();
    const { headers, sampleRows, workspaceId } = body;

    // Verify user has access to workspace
    const userEmail = session.user.email?.toLowerCase() || '';
    const isAdminUser = isSuperAdmin(userEmail);

    if (!isAdminUser) {
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', session.user.id)
        .single();

      if (!membership) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    }

    // Analyze columns and create mapping suggestions
    const suggestions = await analyzeColumns(headers, sampleRows);

    return NextResponse.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('AI Column Mapping error:', error);
    return NextResponse.json({ 
      error: 'Column mapping analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Analyze columns and suggest mappings
async function analyzeColumns(headers: string[], sampleRows: string[][]): Promise<MappingSuggestion[]> {
  // Available mapping fields
  const availableFields = [
    { value: 'customer_name', keywords: ['name', 'customer', 'client', 'company', 'account'], examples: ['customer_name', 'client_name', 'company_name', 'account_name'] },
    { value: 'customer_email', keywords: ['email', 'e-mail', 'mail'], examples: ['email', 'customer_email', 'user_email'] },
    { value: 'company', keywords: ['company', 'organisation', 'organization', 'firm'], examples: ['company', 'company_name', 'organisation'] },
    { value: 'mrr', keywords: ['mrr', 'recurring', 'monthly', 'revenue'], examples: ['mrr', 'monthly_revenue', 'recurring_revenue'] },
    { value: 'churn_risk', keywords: ['churn', 'risk', 'retention'], examples: ['churn_risk', 'retention_risk', 'churn_probability'] },
    { value: 'last_activity', keywords: ['activity', 'last', 'recent', 'date'], examples: ['last_activity', 'last_seen', 'recent_activity'] },
    { value: 'support_tickets', keywords: ['ticket', 'support', 'issue', 'case'], examples: ['support_tickets', 'tickets', 'open_tickets'] },
    { value: 'feature_usage', keywords: ['usage', 'feature', 'use', 'utilization'], examples: ['feature_usage', 'usage', 'app_usage'] },
    { value: 'industry', keywords: ['industry', 'sector', 'vertical'], examples: ['industry', 'sector', 'industry_type'] },
    { value: 'company_size', keywords: ['size', 'employees', 'headcount'], examples: ['company_size', 'employees', 'headcount'] },
    { value: 'contract_value', keywords: ['contract', 'value', 'amount', 'revenue'], examples: ['contract_value', 'total_contract_value', 'revenue'] },
    { value: 'renewal_date', keywords: ['renewal', 'expiry', 'expiration', 'end_date'], examples: ['renewal_date', 'expiry_date', 'contract_end'] }
  ];

  const suggestions: MappingSuggestion[] = [];

  for (const header of headers) {
    const headerLower = header.toLowerCase().trim();
    let bestMatch: { field: string; confidence: number; reasoning: string } | null = null;

    // Check each available field
    for (const field of availableFields) {
      // Check if header name matches keywords or examples
      const keywordMatch = field.keywords.some(keyword => headerLower.includes(keyword));
      const exampleMatch = field.examples.some(example => 
        headerLower === example || headerLower.includes(example) || example.includes(headerLower)
      );

      let confidence = 0;
      let reasoning = '';

      if (exampleMatch) {
        confidence = 0.95;
        reasoning = `Column name "${header}" matches known field pattern "${field.value}"`;
      } else if (keywordMatch) {
        confidence = 0.75;
        reasoning = `Column name "${header}" contains keywords related to "${field.value}"`;
        
        // Check sample data for additional confidence
        const columnIndex = headers.indexOf(header);
        if (columnIndex >= 0 && sampleRows.length > 0) {
          const sampleData = sampleRows.slice(0, 5).map(row => row[columnIndex]).filter(Boolean);
          
          // Data type validation
          if (field.value === 'customer_email' && sampleData.some(val => val.includes('@'))) {
            confidence = 0.95;
            reasoning += ' (contains email addresses)';
          } else if (field.value === 'mrr' || field.value === 'contract_value') {
            const numericCount = sampleData.filter(val => !isNaN(parseFloat(val))).length;
            if (numericCount === sampleData.length) {
              confidence = Math.min(0.95, confidence + 0.15);
              reasoning += ' (contains numeric values)';
            }
          } else if (field.value === 'renewal_date' || field.value === 'last_activity') {
            const datePattern = /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/;
            const dateCount = sampleData.filter(val => datePattern.test(val)).length;
            if (dateCount > 0) {
              confidence = Math.min(0.95, confidence + 0.15);
              reasoning += ' (contains date-like values)';
            }
          }
        }
      }

      // Check for partial matches (e.g., "cli_name" -> "customer_name")
      if (!bestMatch || confidence > bestMatch.confidence) {
        if (confidence > 0.5) {
          bestMatch = { field: field.value, confidence, reasoning };
        }
      }
    }

    // If no good match found, use AI to analyze
    if (!bestMatch || bestMatch.confidence < 0.6) {
      const aiSuggestion = await getAISuggestion(header, headers, sampleRows, availableFields);
      if (aiSuggestion && aiSuggestion.confidence > (bestMatch?.confidence || 0)) {
        bestMatch = aiSuggestion;
      }
    }

    if (bestMatch) {
      suggestions.push({
        originalColumn: header,
        suggestedField: bestMatch.field,
        confidence: bestMatch.confidence,
        reasoning: bestMatch.reasoning
      });
    } else {
      // No match found - suggest unmapped
      suggestions.push({
        originalColumn: header,
        suggestedField: 'unmapped',
        confidence: 0,
        reasoning: `No clear match found for column "${header}"`
      });
    }
  }

  return suggestions;
}

// Use AI to suggest column mapping when pattern matching is insufficient
async function getAISuggestion(
  header: string,
  headers: string[],
  sampleRows: string[][],
  availableFields: any[]
): Promise<{ field: string; confidence: number; reasoning: string } | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const columnIndex = headers.indexOf(header);
    const sampleData = sampleRows.slice(0, 10).map(row => row[columnIndex] || '').filter(Boolean);
    
    // Create a prompt for AI analysis
    const prompt = `You are a data analyst. Analyze this CSV column and suggest which field it maps to.

Column name: "${header}"
Sample values (first 10): ${sampleData.slice(0, 10).join(', ')}

Available fields to map to:
${availableFields.map(f => `- ${f.value}: ${f.examples.join(', ')}`).join('\n')}

Respond with ONLY a JSON object in this format:
{
  "field": "customer_name",
  "confidence": 0.85,
  "reasoning": "Brief explanation"
}

If no match is clear, set field to "unmapped" and confidence to 0.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use cheaper model for simple mapping
        messages: [
          {
            role: 'system',
            content: 'You are a data analyst. Respond with only valid JSON, no other text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (content) {
      // Try to parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          field: result.field || 'unmapped',
          confidence: result.confidence || 0,
          reasoning: result.reasoning || 'AI analysis'
        };
      }
    }
  } catch (error) {
    console.error('AI suggestion error:', error);
  }

  return null;
}

