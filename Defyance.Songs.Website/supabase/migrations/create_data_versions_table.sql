CREATE TABLE IF NOT EXISTS data_versions (
    entity_type TEXT PRIMARY KEY,
    version INTEGER DEFAULT 1
);

-- Initialize with base types
INSERT INTO data_versions (entity_type, version) VALUES
    ('setlists', 1),
    ('songs', 1),
    ('events', 1),
    ('master_setlists', 1)
ON CONFLICT (entity_type) DO NOTHING;





 -- Create the data_versions table if it doesn't exist
 CREATE TABLE IF NOT EXISTS data_versions (
     entity_type TEXT PRIMARY KEY,
     version INTEGER DEFAULT 1
 );

 -- Initialize version counts for core entities
 INSERT INTO data_versions (entity_type, version) VALUES
     ('setlists', 1),
     ('songs', 1),
     ('events', 1),
     ('master_setlists', 1)
 ON CONFLICT (entity_type) DO NOTHING;

 -- Function to increment version
 CREATE OR REPLACE FUNCTION increment_version()
 RETURNS TRIGGER AS $$
 BEGIN
     UPDATE data_versions
     SET version = version + 1
     WHERE entity_type = TG_TABLE_NAME;
     RETURN NEW;
 END;
 $$ LANGUAGE plpgsql;

 -- Triggers for entity tables to automatically increment version on changes
 CREATE TRIGGER setlists_version_trigger
 AFTER INSERT OR UPDATE OR DELETE ON setlists
 FOR EACH ROW EXECUTE FUNCTION increment_version();

 CREATE TRIGGER songs_version_trigger
 AFTER INSERT OR UPDATE OR DELETE ON songs
 FOR EACH ROW EXECUTE FUNCTION increment_version();

 CREATE TRIGGER events_version_trigger
 AFTER INSERT OR UPDATE OR DELETE ON events
 FOR EACH ROW EXECUTE FUNCTION increment_version();

 CREATE TRIGGER master_setlists_version_trigger
 AFTER INSERT OR UPDATE OR DELETE ON master_setlists
 FOR EACH ROW EXECUTE FUNCTION increment_version();

 -- Note: Consider adding triggers for other tables that might affect these entities
 -- if a broader synchronization is needed in the future.