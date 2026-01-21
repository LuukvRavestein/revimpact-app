import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Papa from 'papaparse';
import { Resend } from 'resend';
import type { BeamerCSVRow } from '@/lib/types/nps';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file content
    const fileContent = await file.text();

    // Parse CSV
    const parseResult = await new Promise<Papa.ParseResult<BeamerCSVRow>>((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: resolve,
        error: reject,
      });
    });

    const rows = parseResult.data;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Process and validate rows
    const validRows: BeamerCSVRow[] = [];
    const errors: string[] = [];

    rows.forEach((row, index) => {
      // Validate required fields
      if (!row.user_email || !row.cli_name) {
        errors.push(`Row ${index + 1}: Missing required fields (user_email or cli_name)`);
        return;
      }

      const score = typeof row.score === 'string' ? parseInt(row.score) : row.score;

      if (isNaN(score) || score < 0 || score > 10) {
        errors.push(`Row ${index + 1}: Invalid score (must be 0-10)`);
        return;
      }

      validRows.push({ ...row, score });
    });

    if (validRows.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid rows found',
          details: errors,
        },
        { status: 400 }
      );
    }

    // Insert rows into database
    const insertData = validRows.map((row) => ({
      cli_name: row.cli_name,
      response_date: parseDate(row.date),
      week: row.week || null,
      user_email: row.user_email,
      user_first_name: row.user_first_name || null,
      user_last_name: row.user_last_name || null,
      feedback: row.feedback || null,
      score: typeof row.score === 'string' ? parseInt(row.score) : row.score,
      imported_by: user.id,
    }));

    const { data: insertedResponses, error: insertError } = await supabase
      .from('nps_responses')
      .upsert(insertData, {
        onConflict: 'user_email,response_date,cli_name',
        ignoreDuplicates: false,
      })
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        {
          error: 'Failed to insert data',
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    // Get detractors (score <= 6) from inserted responses
    const detractors = insertedResponses?.filter((r: any) => r.score <= 6) || [];

    // Send emails to detractors
    let emailsSent = 0;
    const emailErrors: string[] = [];

    // Get email template
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'Detractor Response')
      .eq('is_active', true)
      .single();

    if (template && detractors.length > 0) {
      for (const detractor of detractors) {
        try {
          // Check if we already sent an email for this response
          const { data: existingOutreach } = await supabase
            .from('nps_outreach')
            .select('id')
            .eq('nps_response_id', detractor.id)
            .single();

          if (existingOutreach) {
            // Already sent email for this response
            continue;
          }

          // Personalize email template
          const emailBody = template.body
            .replace(/\{\{first_name\}\}/g, detractor.user_first_name || 'daar')
            .replace(/\{\{last_name\}\}/g, detractor.user_last_name || '')
            .replace(/\{\{cli_name\}\}/g, detractor.cli_name)
            .replace(/\{\{score\}\}/g, detractor.score.toString());

          const emailSubject = template.subject
            .replace(/\{\{first_name\}\}/g, detractor.user_first_name || 'daar')
            .replace(/\{\{cli_name\}\}/g, detractor.cli_name);

          // Send email via Resend
          const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'Luuk van Ravestein <luuk.van.ravestein@timewax.com>',
            to: detractor.user_email,
            subject: emailSubject,
            html: emailBody.replace(/\n/g, '<br>'),
          });

          if (emailError) {
            emailErrors.push(`Failed to send to ${detractor.user_email}: ${emailError.message}`);

            // Log failed outreach
            await supabase.from('nps_outreach').insert({
              nps_response_id: detractor.id,
              sent_to: detractor.user_email,
              email_subject: emailSubject,
              email_body: emailBody,
              status: 'failed',
              error_message: emailError.message,
            });
          } else {
            emailsSent++;

            // Log successful outreach
            await supabase.from('nps_outreach').insert({
              nps_response_id: detractor.id,
              sent_at: new Date().toISOString(),
              sent_to: detractor.user_email,
              email_subject: emailSubject,
              email_body: emailBody,
              status: 'sent',
              resend_email_id: emailData?.id || null,
            });
          }
        } catch (err: any) {
          emailErrors.push(`Error processing ${detractor.user_email}: ${err.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported: insertedResponses?.length || 0,
      detractors: detractors.length,
      emails_sent: emailsSent,
      email_errors: emailErrors.length > 0 ? emailErrors : undefined,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        error: 'Import failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to parse dates from Beamer format
function parseDate(dateString: string): string {
  try {
    // Beamer format: "20 Oct 2025"
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Fallback to current date if parsing fails
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}
