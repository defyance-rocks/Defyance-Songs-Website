-- Migration: Add Setlist Markers and repeatable songs
BEGIN;

-- 1. Create setlist_items table
CREATE TABLE setlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setlist_id UUID REFERENCES setlists(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    label TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    linked_to UUID REFERENCES setlist_items(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_item_type CHECK (
        (song_id IS NOT NULL AND label IS NULL) OR
        (song_id IS NULL AND label IS NOT NULL)
    )
);

-- 2. Migrate data from setlist_songs
INSERT INTO setlist_items (setlist_id, song_id, position)
SELECT setlist_id, song_id, position FROM setlist_songs;

-- Fix linked_to for migrated data
UPDATE setlist_items target
SET linked_to = (
    SELECT si.id 
    FROM setlist_items si
    JOIN setlist_songs old_link ON old_link.setlist_id = si.setlist_id AND old_link.linked_to = si.song_id
    WHERE old_link.setlist_id = target.setlist_id AND old_link.song_id = target.song_id
);

-- 3. Drop old table
DROP TABLE setlist_songs;

-- 4. Reorder function
CREATE OR REPLACE FUNCTION reorder_setlist_items(p_setlist_id UUID, p_item_ids UUID[], p_positions INTEGER[])
RETURNS void AS $$
BEGIN
    FOR i IN 1 .. array_upper(p_item_ids, 1) LOOP
        UPDATE setlist_items 
        SET position = p_positions[i]
        WHERE id = p_item_ids[i] AND setlist_id = p_setlist_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS
ALTER TABLE setlist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select" ON setlist_items;
CREATE POLICY "Public Select" ON setlist_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin All" ON setlist_items;
CREATE POLICY "Admin All" ON setlist_items FOR ALL TO authenticated USING (public.get_my_role() = 'admin');

-- Band Member Policies
DROP POLICY IF EXISTS "Band Member Setlist Items Insert" ON setlist_items;
CREATE POLICY "Band Member Setlist Items Insert" ON setlist_items FOR INSERT TO authenticated 
WITH CHECK (
    public.get_my_role() = 'band_member' AND 
    (
        label IS NOT NULL OR 
        EXISTS (SELECT 1 FROM songs WHERE id = song_id AND status != 'Approved')
    )
);

DROP POLICY IF EXISTS "Band Member Setlist Items Update" ON setlist_items;
CREATE POLICY "Band Member Setlist Items Update" ON setlist_items FOR UPDATE TO authenticated 
USING (
    public.get_my_role() = 'band_member' AND 
    (
        label IS NOT NULL OR 
        EXISTS (SELECT 1 FROM songs WHERE id = song_id AND status != 'Approved')
    )
);

DROP POLICY IF EXISTS "Band Member Setlist Items Delete" ON setlist_items;
CREATE POLICY "Band Member Setlist Items Delete" ON setlist_items FOR DELETE TO authenticated 
USING (
    public.get_my_role() = 'band_member' AND 
    (
        label IS NOT NULL OR 
        EXISTS (SELECT 1 FROM songs WHERE id = song_id AND status != 'Approved')
    )
);

-- 6. Trigger for versioning
-- First add setlist_items to data_versions if not exists
INSERT INTO data_versions (entity_type, version) VALUES ('setlist_items', 1) ON CONFLICT DO NOTHING;

CREATE TRIGGER setlist_items_version_trigger
AFTER INSERT OR UPDATE OR DELETE ON setlist_items
FOR EACH ROW EXECUTE FUNCTION increment_version();

COMMIT;
