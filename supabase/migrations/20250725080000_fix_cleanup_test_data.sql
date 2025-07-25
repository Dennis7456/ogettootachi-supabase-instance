-- Migration: Fix cleanup_test_data to handle chatbot_conversations foreign key
-- This migration updates the cleanup_test_data function to delete from chatbot_conversations before deleting users.

CREATE OR REPLACE FUNCTION cleanup_test_data(
  p_doc_id UUID DEFAULT NULL,
  p_test_user_id UUID DEFAULT NULL,
  p_admin_user_id UUID DEFAULT NULL
) 
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clean up document if ID is provided
  IF p_doc_id IS NOT NULL THEN
    DELETE FROM public.documents WHERE id = p_doc_id;
  END IF;
  
  -- Clean up test user profiles and auth records if IDs are provided
  IF p_test_user_id IS NOT NULL THEN
    DELETE FROM chatbot_conversations WHERE user_id = p_test_user_id;
    DELETE FROM public.profiles WHERE id = p_test_user_id;
    DELETE FROM auth.users WHERE id = p_test_user_id;
  END IF;
  
  -- Clean up admin user profiles and auth records if IDs are provided
  IF p_admin_user_id IS NOT NULL THEN
    DELETE FROM chatbot_conversations WHERE user_id = p_admin_user_id;
    DELETE FROM public.profiles WHERE id = p_admin_user_id;
    DELETE FROM auth.users WHERE id = p_admin_user_id;
  END IF;
  
  -- Fallback: Clean up any remaining test documents without specific IDs
  DELETE FROM public.documents WHERE title = 'Test Document';
  
  -- Fallback: Clean up any remaining test users without specific IDs
  DELETE FROM public.profiles WHERE email LIKE 'test_%@example.com' OR email LIKE 'admin_%@example.com';
  DELETE FROM auth.users WHERE email LIKE 'test_%@example.com' OR email LIKE 'admin_%@example.com';
  DELETE FROM chatbot_conversations WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'test_%@example.com' OR email LIKE 'admin_%@example.com'
  );
END;
$$; 