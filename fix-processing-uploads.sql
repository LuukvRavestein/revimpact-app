-- Fix stuck "processing" uploads and check data
-- Run this in your Production Supabase SQL editor

-- 1. Check uploads with processing status
SELECT 
  id,
  filename,
  upload_date,
  status,
  (SELECT COUNT(*) FROM academy_participant_progress WHERE upload_id = academy_data_uploads.id) as records_count
FROM academy_data_uploads
WHERE status = 'processing'
ORDER BY upload_date DESC;

-- 2. Update stuck processing uploads to processed if they have records
UPDATE academy_data_uploads
SET status = 'processed'
WHERE status = 'processing'
  AND id IN (
    SELECT DISTINCT upload_id 
    FROM academy_participant_progress 
    WHERE upload_id IS NOT NULL
  );

-- 3. Update stuck processing uploads to error if they have no records (older than 5 minutes)
UPDATE academy_data_uploads
SET status = 'error'
WHERE status = 'processing'
  AND id NOT IN (
    SELECT DISTINCT upload_id 
    FROM academy_participant_progress 
    WHERE upload_id IS NOT NULL
  )
  AND upload_date < NOW() - INTERVAL '5 minutes';

-- 4. Check total records per upload
SELECT 
  adu.id,
  adu.filename,
  adu.upload_date,
  adu.status,
  COUNT(app.id) as total_records
FROM academy_data_uploads adu
LEFT JOIN academy_participant_progress app ON adu.id = app.upload_id
GROUP BY adu.id, adu.filename, adu.upload_date, adu.status
ORDER BY adu.upload_date DESC;

-- 5. Check for duplicate records (same participant, email, module, upload)
SELECT 
  participant_name,
  participant_email,
  lesson_module,
  upload_id,
  COUNT(*) as duplicate_count
FROM academy_participant_progress
GROUP BY participant_name, participant_email, lesson_module, upload_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 20;

