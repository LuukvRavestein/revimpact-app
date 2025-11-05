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
  // Available mapping fields with improved patterns
  const availableFields = [
    { 
      value: 'customer_name', 
      keywords: ['customer', 'client', 'company', 'account', 'name'], 
      examples: ['customer_name', 'client_name', 'company_name', 'account_name', 'cli_name', 'customer', 'client'],
      excludePatterns: ['app_', 'feature_', 'usage', 'id'], // Exclude app_name, feature_usage, etc.
      dataTypeHints: ['text']
    },
    { 
      value: 'customer_email', 
      keywords: ['email', 'e-mail', 'mail'], 
      examples: ['email', 'customer_email', 'user_email', 'client_email'],
      dataTypeHints: ['email']
    },
    { 
      value: 'company', 
      keywords: ['company', 'organisation', 'organization', 'firm'], 
      examples: ['company', 'company_name', 'organisation', 'organization'],
      dataTypeHints: ['text']
    },
    { 
      value: 'mrr', 
      keywords: ['mrr', 'recurring', 'monthly', 'revenue'], 
      examples: ['mrr', 'monthly_revenue', 'recurring_revenue'],
      dataTypeHints: ['number', 'numeric']
    },
    { 
      value: 'churn_risk', 
      keywords: ['churn', 'risk', 'retention'], 
      examples: ['churn_risk', 'retention_risk', 'churn_probability'],
      dataTypeHints: ['text', 'number']
    },
    { 
      value: 'last_activity', 
      keywords: ['activity', 'last', 'recent', 'date', 'seen'], 
      examples: ['last_activity', 'last_seen', 'recent_activity', 'last_accessed'],
      dataTypeHints: ['date', 'datetime']
    },
    { 
      value: 'support_tickets', 
      keywords: ['ticket', 'support', 'issue', 'case'], 
      examples: ['support_tickets', 'tickets', 'open_tickets', 'support_cases'],
      dataTypeHints: ['number', 'numeric']
    },
    { 
      value: 'feature_usage', 
      keywords: ['usage', 'feature', 'use', 'utilization', 'app'], 
      examples: ['feature_usage', 'usage', 'app_usage', 'app_name', 'feature_name', 'application'],
      dataTypeHints: ['number', 'numeric', 'text']
    },
    { 
      value: 'industry', 
      keywords: ['industry', 'sector', 'vertical'], 
      examples: ['industry', 'sector', 'industry_type'],
      dataTypeHints: ['text']
    },
    { 
      value: 'company_size', 
      keywords: ['size', 'employees', 'headcount'], 
      examples: ['company_size', 'employees', 'headcount', 'employee_count'],
      dataTypeHints: ['number', 'numeric']
    },
    { 
      value: 'contract_value', 
      keywords: ['contract', 'value', 'amount', 'revenue'], 
      examples: ['contract_value', 'total_contract_value', 'revenue', 'arr'],
      dataTypeHints: ['number', 'numeric']
    },
    { 
      value: 'renewal_date', 
      keywords: ['renewal', 'expiry', 'expiration', 'end_date', 'expires'], 
      examples: ['renewal_date', 'expiry_date', 'contract_end', 'expiration_date'],
      dataTypeHints: ['date']
    }
  ];

  const suggestions: MappingSuggestion[] = [];

  for (const header of headers) {
    const headerLower = header.toLowerCase().trim();
    let bestMatch: { field: string; confidence: number; reasoning: string } | null = null;

    // Special handling for common patterns FIRST (highest priority)
    if (headerLower === 'cli_name' || headerLower === 'client_name') {
      bestMatch = { field: 'customer_name', confidence: 0.90, reasoning: `Column "${header}" is clearly a client/customer name` };
    } else if (headerLower === 'app_name' || headerLower === 'application_name') {
      bestMatch = { field: 'feature_usage', confidence: 0.85, reasoning: `Column "${header}" represents application/feature names (part of feature usage data)` };
    }

    // If no special match, check each available field
    if (!bestMatch) {
      for (const field of availableFields) {
      // Skip if header matches exclude patterns
      if (field.excludePatterns && field.excludePatterns.some(pattern => headerLower.includes(pattern.toLowerCase()))) {
        continue;
      }

      // Check if header name matches keywords or examples
      const keywordMatch = field.keywords.some(keyword => headerLower.includes(keyword));
      const exampleMatch = field.examples.some(example => {
        const exampleLower = example.toLowerCase();
        return headerLower === exampleLower || 
               headerLower.includes(exampleLower) || 
               exampleLower.includes(headerLower) ||
               headerLower.startsWith(exampleLower) ||
               exampleLower.startsWith(headerLower);
      });

      let confidence = 0;
      let reasoning = '';

      // Get sample data for analysis
      const columnIndex = headers.indexOf(header);
      const sampleData = columnIndex >= 0 && sampleRows.length > 0 
        ? sampleRows.slice(0, 10).map(row => row[columnIndex]).filter(Boolean)
        : [];

      if (exampleMatch) {
        confidence = 0.95;
        reasoning = `Column name "${header}" matches known field pattern "${field.value}"`;
      } else if (keywordMatch) {
        confidence = 0.70;
        reasoning = `Column name "${header}" contains keywords related to "${field.value}"`;
      }

      // Enhanced data type validation
      if (sampleData.length > 0) {
        // Email validation
        if (field.value === 'customer_email') {
          const emailCount = sampleData.filter(val => typeof val === 'string' && val.includes('@')).length;
          if (emailCount > 0) {
            confidence = Math.max(confidence, 0.95);
            reasoning = `Column "${header}" contains email addresses (${emailCount}/${sampleData.length})`;
          }
        }
        // Numeric validation
        else if (field.dataTypeHints?.includes('number') || field.dataTypeHints?.includes('numeric')) {
          const numericCount = sampleData.filter(val => {
            const num = parseFloat(String(val));
            return !isNaN(num) && isFinite(num);
          }).length;
          if (numericCount === sampleData.length && sampleData.length > 0) {
            confidence = Math.min(0.95, confidence + 0.20);
            reasoning += ` (contains numeric values: ${numericCount}/${sampleData.length})`;
          }
        }
        // Date validation
        else if (field.dataTypeHints?.includes('date')) {
          const datePattern = /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{4}\d{2}\d{2}/;
          const dateCount = sampleData.filter(val => datePattern.test(String(val))).length;
          if (dateCount > 0) {
            confidence = Math.min(0.95, confidence + 0.15);
            reasoning += ` (contains date-like values: ${dateCount}/${sampleData.length})`;
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
    }
    
    // Week number validation (e.g., 202535) - check before AI fallback
    if (!bestMatch || bestMatch.confidence < 0.6) {
      if (headerLower.includes('week') || headerLower === 'week') {
        const columnIndex = headers.indexOf(header);
        const sampleData = columnIndex >= 0 && sampleRows.length > 0 
          ? sampleRows.slice(0, 10).map(row => row[columnIndex]).filter(Boolean)
          : [];
        if (sampleData.length > 0) {
          const weekPattern = /^\d{4}\d{2}$|^\d{4}W\d{2}$/; // YYYYWW format
          const weekCount = sampleData.filter(val => weekPattern.test(String(val))).length;
          if (weekCount > 0) {
            bestMatch = { 
              field: 'last_activity', 
              confidence: 0.85, 
              reasoning: `Column "${header}" contains week numbers (format: YYYYWW) - mapped to last_activity for time-based analysis` 
            };
          }
        }
      }
    }

    // ID validation (numeric IDs) - check before AI fallback
    if (!bestMatch || bestMatch.confidence < 0.6) {
      if (headerLower.endsWith('_id') || headerLower === 'id') {
        const columnIndex = headers.indexOf(header);
        const sampleData = columnIndex >= 0 && sampleRows.length > 0 
          ? sampleRows.slice(0, 10).map(row => row[columnIndex]).filter(Boolean)
          : [];
        if (sampleData.length > 0) {
          const idPattern = /^\d+$/;
          const idCount = sampleData.filter(val => idPattern.test(String(val))).length;
          if (idCount === sampleData.length && sampleData.length > 0) {
            // ID columns typically don't map to standard fields
            bestMatch = { 
              field: 'unmapped', 
              confidence: 0.3, 
              reasoning: `Column "${header}" is a numeric ID field (typically not mapped to customer data fields)` 
            };
          }
        }
      }
    }

    // If no good match found, use AI to analyze
    if (!bestMatch || bestMatch.confidence < 0.5) {
      const aiSuggestion = await getAISuggestion(header, headers, sampleRows, availableFields);
      if (aiSuggestion && aiSuggestion.confidence > (bestMatch?.confidence || 0)) {
        bestMatch = aiSuggestion;
      }
    }

    if (bestMatch && bestMatch.confidence > 0.3) {
      suggestions.push({
        originalColumn: header,
        suggestedField: bestMatch.field,
        confidence: bestMatch.confidence,
        reasoning: bestMatch.reasoning
      });
    } else {
      // For ID columns and week numbers, suggest unmapped but with explanation
      if (headerLower.endsWith('_id') || headerLower === 'id') {
        suggestions.push({
          originalColumn: header,
          suggestedField: 'unmapped',
          confidence: 0.3,
          reasoning: `Column "${header}" is an identifier field (typically not mapped to customer data fields)`
        });
      } else if (headerLower.includes('week')) {
        suggestions.push({
          originalColumn: header,
          suggestedField: 'last_activity',
          confidence: 0.5,
          reasoning: `Column "${header}" appears to be a week/time period field (mapped to last_activity for time-based analysis)`
        });
      } else {
        // No match found - suggest unmapped
        suggestions.push({
          originalColumn: header,
          suggestedField: 'unmapped',
          confidence: 0,
          reasoning: `No clear match found for column "${header}". Consider mapping manually.`
        });
      }
    }
  }

  return suggestions;
}

// Use AI to suggest column mapping when pattern matching is insufficient
async function getAISuggestion(
  header: string,
  headers: string[],
  sampleRows: string[][],
  availableFields: Array<{value: string; keywords: string[]; examples: string[]}>
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
All column names in this dataset: ${headers.join(', ')}

Available fields to map to:
${availableFields.map(f => `- ${f.value}: ${f.examples.join(', ')} (keywords: ${f.keywords.join(', ')})`).join('\n')}

Important context:
- "cli_name" or "client_name" should map to "customer_name"
- "app_name" or application names should map to "feature_usage"
- Week numbers (format YYYYWW like 202535) should map to "last_activity"
- ID columns (ending in "_id" or just "id") are typically "unmapped" unless they contain customer/client in the name

Respond with ONLY a JSON object in this format:
{
  "field": "customer_name",
  "confidence": 0.85,
  "reasoning": "Brief explanation of why this mapping makes sense"
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

