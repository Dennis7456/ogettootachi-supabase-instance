-- Test if tables exist and have correct structure
SELECT 'job_applications' as table_name, 
       column_name, 
       data_type, 
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'job_applications'
ORDER BY ordinal_position;

SELECT 'job_postings' as table_name, 
       column_name, 
       data_type, 
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'job_postings'
ORDER BY ordinal_position;

-- Test if function exists
SELECT routine_name, routine_type, data_type
FROM information_schema.routines 
WHERE routine_name = 'get_applications'; 