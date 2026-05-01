-- ==========================================
-- AUTHORIZATION & SONG STATUS MIGRATION
-- ==========================================

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'band_member')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add Status to Songs
ALTER TABLE songs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Draft';

-- 3. Enable RLS on all tables
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- 4. Helper function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_my_role() 
RETURNS text AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Helper function for policies to save repetition
-- (We'll use standard SQL for policies for better visibility in Supabase Dashboard)

-- 6. Define Policies for each table

-- For all tables: Public Read Access
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public Select" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Public Select" ON public.%I FOR SELECT USING (true)', t);
        
        EXECUTE format('DROP POLICY IF EXISTS "Admin All" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Admin All" ON public.%I FOR ALL TO authenticated USING (public.get_my_role() = ''admin'')', t);
    END LOOP;
END $$;

-- 7. Specific Band Member Policies for Songs
DROP POLICY IF EXISTS "Band Member Songs Insert" ON songs;
CREATE POLICY "Band Member Songs Insert" ON songs FOR INSERT TO authenticated 
WITH CHECK (public.get_my_role() = 'band_member');

DROP POLICY IF EXISTS "Band Member Songs Update" ON songs;
CREATE POLICY "Band Member Songs Update" ON songs FOR UPDATE TO authenticated 
USING (public.get_my_role() = 'band_member' AND status != 'Approved');

DROP POLICY IF EXISTS "Band Member Songs Delete" ON songs;
CREATE POLICY "Band Member Songs Delete" ON songs FOR DELETE TO authenticated 
USING (public.get_my_role() = 'band_member' AND status != 'Approved');

-- 8. Specific Band Member Policies for Documents
DROP POLICY IF EXISTS "Band Member Documents Insert" ON entity_documents;
CREATE POLICY "Band Member Documents Insert" ON entity_documents FOR INSERT TO authenticated 
WITH CHECK (public.get_my_role() = 'band_member' AND entity_type = 'songs');

DROP POLICY IF EXISTS "Band Member Documents Delete" ON entity_documents;
CREATE POLICY "Band Member Documents Delete" ON entity_documents FOR DELETE TO authenticated 
USING (
    public.get_my_role() = 'band_member' AND 
    entity_type = 'songs' AND
    EXISTS (SELECT 1 FROM songs WHERE id = entity_id AND status != 'Approved')
);

-- 9. Specific Band Member Policies for Junction Tables (Optional but good for completeness)
-- Band members should probably be able to assign songs to setlists?
-- The prompt said: "a band member scope which has the current logged out access plus the ability to add new songs"
-- "An unapproved song can be fully edited and deleted by a band member."
-- This might include vocalists, and setlist assignments.

-- Vocalists for unapproved songs
DROP POLICY IF EXISTS "Band Member Vocalists Insert" ON song_vocalists;
CREATE POLICY "Band Member Vocalists Insert" ON song_vocalists FOR INSERT TO authenticated 
WITH CHECK (
    public.get_my_role() = 'band_member' AND 
    EXISTS (SELECT 1 FROM songs WHERE id = song_id AND status != 'Approved')
);

DROP POLICY IF EXISTS "Band Member Vocalists Delete" ON song_vocalists;
CREATE POLICY "Band Member Vocalists Delete" ON song_vocalists FOR DELETE TO authenticated 
USING (
    public.get_my_role() = 'band_member' AND 
    EXISTS (SELECT 1 FROM songs WHERE id = song_id AND status != 'Approved')
);

-- Setlist assignments for unapproved songs
DROP POLICY IF EXISTS "Band Member Setlist Songs Insert" ON setlist_songs;
CREATE POLICY "Band Member Setlist Songs Insert" ON setlist_songs FOR INSERT TO authenticated 
WITH CHECK (
    public.get_my_role() = 'band_member' AND 
    EXISTS (SELECT 1 FROM songs WHERE id = song_id AND status != 'Approved')
);

DROP POLICY IF EXISTS "Band Member Setlist Songs Delete" ON setlist_songs;
CREATE POLICY "Band Member Setlist Songs Delete" ON setlist_songs FOR DELETE TO authenticated 
USING (
    public.get_my_role() = 'band_member' AND 
    EXISTS (SELECT 1 FROM songs WHERE id = song_id AND status != 'Approved')
);

DROP POLICY IF EXISTS "Band Member Setlist Songs Update" ON setlist_songs;
CREATE POLICY "Band Member Setlist Songs Update" ON setlist_songs FOR UPDATE TO authenticated 
USING (
    public.get_my_role() = 'band_member' AND 
    EXISTS (SELECT 1 FROM songs WHERE id = song_id AND status != 'Approved')
);

-- 10. Automatically create profile for new users (Default to band_member for safety, or admin if it's the first user?)
-- Let's keep it simple and just create the table and policies. The user will manage roles.
