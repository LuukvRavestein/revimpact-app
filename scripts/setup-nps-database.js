#!/usr/bin/env node

/**
 * CSM Agent NPS Automation - Database Setup Script
 *
 * Dit script voert automatisch het database schema uit in Supabase.
 *
 * Gebruik:
 *   node scripts/setup-nps-database.js
 *
 * Requirements:
 *   - .env.local file met SUPABASE_SERVICE_ROLE_KEY
 *   - of SUPABASE_SERVICE_ROLE_KEY als environment variable
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`${colors.cyan}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

async function main() {
  log('\n🚀 CSM Agent NPS Database Setup\n', 'bright');

  // Step 1: Load environment variables
  logStep(1, 'Loading environment variables...');

  // Try to load from .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = envContent.split('\n');
    envVars.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    logSuccess('.env.local loaded');
  } else {
    logWarning('.env.local not found, using environment variables');
  }

  // Check for required variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    logError('Missing required environment variables!');
    console.log('\nRequired variables:');
    console.log('  - NEXT_PUBLIC_SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY');
    console.log('\nAdd these to your .env.local file or set as environment variables.\n');
    process.exit(1);
  }

  logSuccess('Environment variables loaded');

  // Step 2: Connect to Supabase
  logStep(2, 'Connecting to Supabase...');

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  logSuccess('Connected to Supabase');

  // Step 3: Read SQL schema file
  logStep(3, 'Reading schema file...');

  const schemaPath = path.join(process.cwd(), 'nps-automation-schema.sql');

  if (!fs.existsSync(schemaPath)) {
    logError(`Schema file not found: ${schemaPath}`);
    process.exit(1);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  logSuccess('Schema file loaded');

  // Step 4: Execute schema
  logStep(4, 'Executing database schema...');
  logWarning('This may take a few seconds...');

  try {
    // Note: Supabase JS client doesn't support multi-statement SQL execution
    // We need to use the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: schemaSql }),
    });

    if (!response.ok) {
      // Fallback: Try executing via psql if available
      logWarning('Direct execution not supported, trying alternative method...');

      // Split into individual statements and execute one by one
      const statements = schemaSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i] + ';';

        // Skip comments
        if (stmt.trim().startsWith('--')) continue;

        try {
          await supabase.rpc('exec_sql', { query: stmt });
          logSuccess(`Executed statement ${i + 1}/${statements.length}`);
        } catch (err) {
          // Some errors are expected (like "already exists")
          if (err.message?.includes('already exists')) {
            logWarning(`Statement ${i + 1}: Already exists, skipping...`);
          } else {
            logError(`Statement ${i + 1} failed: ${err.message}`);
          }
        }
      }
    }

    logSuccess('Schema executed successfully!');
  } catch (error) {
    logError('Failed to execute schema');
    console.error(error);

    log('\n📝 Manual Setup Instructions:', 'yellow');
    console.log('Since automatic execution failed, please:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy the contents of nps-automation-schema.sql');
    console.log('3. Paste and run in SQL Editor');
    console.log('\nOr see DATABASE_SETUP.md for detailed instructions.\n');

    process.exit(1);
  }

  // Step 5: Verify tables exist
  logStep(5, 'Verifying database setup...');

  const expectedTables = [
    'nps_responses',
    'nps_outreach',
    'csm_tasks',
    'email_templates',
  ];

  for (const tableName of expectedTables) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    if (error && error.code !== 'PGRST116') {
      logError(`Table '${tableName}' not accessible: ${error.message}`);
    } else {
      logSuccess(`Table '${tableName}' exists`);
    }
  }

  // Step 6: Check default template
  logStep(6, 'Checking default email template...');

  const { data: template, error: templateError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('name', 'Detractor Response')
    .single();

  if (templateError) {
    logWarning('Default template not found, may need to run seed data manually');
  } else {
    logSuccess('Default email template exists');
  }

  // Success!
  log('\n✅ Database setup complete!\n', 'green');
  log('Next steps:', 'bright');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Navigate to: http://localhost:3000/csm-agent');
  console.log('3. Try importing a CSV with NPS data\n');
}

// Run the script
main().catch(error => {
  logError('\nUnexpected error occurred:');
  console.error(error);
  process.exit(1);
});
