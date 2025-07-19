-- Function to diagnose and potentially fix user deletion
CREATE OR REPLACE FUNCTION diagnose_user_deletion(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
  current_user_id UUID;
  blocked_tables_list JSONB := '[]'::JSONB;
  tables_to_check TEXT[] := ARRAY[
    'profiles',
    'chatbot_conversations',
    'notifications',
    'blog_posts',
    'appointments',
    'user_invitations'
  ];
  table_name TEXT;
  query TEXT;
  record_count INTEGER;
BEGIN
  -- Get current user's role and ID
  current_user_id := auth.uid();
  
  -- Check current user's role
  SELECT role INTO current_user_role 
  FROM profiles 
  WHERE id = current_user_id;

  -- Validate deletion permissions
  IF current_user_role != 'admin' THEN
    RETURN jsonb_build_object(
      'error', 'Unauthorized',
      'message', 'Only admins can delete users',
      'current_user_role', current_user_role
    );
  END IF;

  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RETURN jsonb_build_object(
      'error', 'Not Found',
      'message', 'User does not exist'
    );
  END IF;

  -- Check for existing records in related tables
  FOREACH table_name IN ARRAY tables_to_check LOOP
    BEGIN
      -- Dynamically construct and execute query to count records
      query := format('SELECT COUNT(*) FROM public.%I WHERE id = $1 OR user_id = $1', table_name);
      EXECUTE query USING target_user_id INTO record_count;
      
      -- If records exist, add to blocked tables list
      IF record_count > 0 THEN
        blocked_tables_list := blocked_tables_list || 
          jsonb_build_object(
            'table', table_name, 
            'record_count', record_count
          );
      END IF;
    EXCEPTION 
      WHEN OTHERS THEN
        -- Ignore errors for tables that might not have these columns
        RAISE NOTICE 'Error checking table %: %', table_name, SQLERRM;
    END;
  END LOOP;

  -- Attempt to delete related records
  BEGIN
    -- Delete from known tables
    DELETE FROM profiles WHERE id = target_user_id;
    DELETE FROM chatbot_conversations WHERE user_id = target_user_id;
    DELETE FROM notifications WHERE user_id = target_user_id;
    
    -- Nullify references in other tables
    UPDATE blog_posts SET created_by = NULL WHERE created_by = target_user_id;
    UPDATE user_invitations SET invited_by = NULL WHERE invited_by = target_user_id;
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE 'Error deleting related records: %', SQLERRM;
  END;

  -- Return diagnostic information
  RETURN jsonb_build_object(
    'status', 'Diagnostic Complete',
    'user_id', target_user_id,
    'blocked_tables', blocked_tables_list,
    'message', 'Attempted to delete user and related records',
    'blocked_table_count', jsonb_array_length(blocked_tables_list)
  );
EXCEPTION 
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Deletion Failed',
      'message', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION diagnose_user_deletion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION diagnose_user_deletion(UUID) TO service_role;

-- Additional function to force user deletion (use with caution)
CREATE OR REPLACE FUNCTION force_user_deletion(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
  current_user_id UUID;
BEGIN
  -- Get current user's role and ID
  current_user_id := auth.uid();
  
  -- Check current user's role
  SELECT role INTO current_user_role 
  FROM profiles 
  WHERE id = current_user_id;

  -- Validate deletion permissions
  IF current_user_role != 'admin' THEN
    RETURN jsonb_build_object(
      'error', 'Unauthorized',
      'message', 'Only admins can force user deletion'
    );
  END IF;

  -- Disable foreign key constraints temporarily
  SET session_replication_role = 'replica';

  BEGIN
    -- Delete from all related tables
    DELETE FROM profiles WHERE id = target_user_id;
    DELETE FROM chatbot_conversations WHERE user_id = target_user_id;
    DELETE FROM notifications WHERE user_id = target_user_id;
    DELETE FROM user_invitations WHERE invited_by = target_user_id;
    
    -- Nullify references in other tables
    UPDATE blog_posts SET created_by = NULL WHERE created_by = target_user_id;
    
    -- Delete from Supabase auth users
    DELETE FROM auth.users WHERE id = target_user_id;

    -- Re-enable foreign key constraints
    SET session_replication_role = 'origin';

    RETURN jsonb_build_object(
      'status', 'Success',
      'message', 'User and all related records deleted forcefully',
      'user_id', target_user_id
    );
  EXCEPTION 
    WHEN OTHERS THEN
      -- Re-enable foreign key constraints
      SET session_replication_role = 'origin';
      
      RETURN jsonb_build_object(
        'error', 'Force Deletion Failed',
        'message', SQLERRM,
        'sqlstate', SQLSTATE
      );
  END;
END;
$$;

-- Grant execute permissions for force deletion
GRANT EXECUTE ON FUNCTION force_user_deletion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION force_user_deletion(UUID) TO service_role; 