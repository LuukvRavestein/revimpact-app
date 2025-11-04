-- Fix Date Offset Issue in Academy Data
-- Run this in your Production Supabase SQL editor
-- This checks and optionally fixes dates that might be off by one day due to timezone conversion

-- 1. Check dates that might be affected (if you have a pattern)
-- Look for dates that are consistently 1 day off
SELECT 
  id,
  participant_name,
  start_date,
  completed_on,
  raw_data->>'Startdatum' as original_startdate,
  raw_data->>'Voltooid op' as original_completedon
FROM academy_participant_progress
WHERE start_date IS NOT NULL
ORDER BY start_date DESC
LIMIT 20;

-- 2. If you need to manually fix specific dates, use this:
-- Update start_date by adding 1 day (adjust based on your findings)
/*
UPDATE academy_participant_progress
SET start_date = start_date + INTERVAL '1 day'
WHERE id IN (
  SELECT id FROM academy_participant_progress
  WHERE raw_data->>'Startdatum' LIKE '%27-10-2025%'
  AND start_date = '2025-10-26'::date
);
*/

-- 3. Check for patterns in date discrepancies
SELECT 
  COUNT(*) as count,
  raw_data->>'Startdatum' as excel_date,
  start_date::text as stored_date,
  (start_date - (raw_data->>'Startdatum')::date) as day_difference
FROM academy_participant_progress
WHERE raw_data->>'Startdatum' IS NOT NULL
  AND start_date IS NOT NULL
GROUP BY raw_data->>'Startdatum', start_date
ORDER BY count DESC
LIMIT 10;

-- Note: The best solution is to re-upload the Excel file after the date parsing fix is deployed
-- This will ensure all dates are correctly parsed from the start

