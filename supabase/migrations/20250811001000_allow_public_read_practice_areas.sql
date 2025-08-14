-- Allow public to read active practice areas for navbar and public pages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'practice_areas' 
      AND policyname = 'Public can read active practice areas'
  ) THEN
    CREATE POLICY "Public can read active practice areas" ON public.practice_areas
      FOR SELECT USING (is_active = true);
  END IF;
END $$;
