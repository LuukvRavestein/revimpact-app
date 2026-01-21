#!/usr/bin/env node

/**
 * CSM Agent NPS Automation - Database Verification Script
 *
 * Dit script checkt of het database schema correct is geïnstalleerd.
 *
 * Gebruik:
 *   node scripts/verify-nps-database.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  console.log('\n🔍 CSM Agent NPS Database Verification\n');

  // Load environment
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('❌ Missing Supabase credentials', 'red');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const checks = {
    tables: ['nps_responses', 'nps_outreach', 'csm_tasks', 'email_templates'],
    views: ['detractors_overview', 'nps_dashboard_stats'],
  };

  let allPassed = true;

  // Check tables
  console.log('📊 Checking Tables...\n');

  for (const tableName of checks.tables) {
    try {
      const { error } = await supabase.from(tableName).select('*').limit(0);

      if (error && error.code !== 'PGRST116') {
        log(`  ❌ ${tableName} - ${error.message}`, 'red');
        allPassed = false;
      } else {
        log(`  ✅ ${tableName}`, 'green');
      }
    } catch (err) {
      log(`  ❌ ${tableName} - ${err.message}`, 'red');
      allPassed = false;
    }
  }

  // Check views
  console.log('\n👁️  Checking Views...\n');

  for (const viewName of checks.views) {
    try {
      const { data, error } = await supabase.from(viewName).select('*').limit(0);

      if (error && error.code !== 'PGRST116') {
        log(`  ❌ ${viewName} - ${error.message}`, 'red');
        allPassed = false;
      } else {
        log(`  ✅ ${viewName}`, 'green');
      }
    } catch (err) {
      log(`  ❌ ${viewName} - ${err.message}`, 'red');
      allPassed = false;
    }
  }

  // Check default template
  console.log('\n📧 Checking Email Templates...\n');

  const { data: templates, error: templateError } = await supabase
    .from('email_templates')
    .select('name, is_active');

  if (templateError) {
    log('  ❌ Could not check templates', 'red');
    allPassed = false;
  } else if (!templates || templates.length === 0) {
    log('  ⚠️  No templates found', 'yellow');
    log('  ℹ️  Run the seed data from nps-automation-schema.sql', 'cyan');
  } else {
    templates.forEach(t => {
      log(`  ✅ ${t.name} (${t.is_active ? 'active' : 'inactive'})`, 'green');
    });
  }

  // Summary
  console.log('\n' + '='.repeat(50));

  if (allPassed) {
    log('\n✅ All checks passed! Database is ready.', 'green');
    console.log('\nYou can now:');
    console.log('  1. npm run dev');
    console.log('  2. Open http://localhost:3000/csm-agent');
    console.log('  3. Import NPS data\n');
  } else {
    log('\n❌ Some checks failed. Please fix the issues above.', 'red');
    console.log('\nTo setup the database:');
    console.log('  - Option 1: node scripts/setup-nps-database.js');
    console.log('  - Option 2: See DATABASE_SETUP.md\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
