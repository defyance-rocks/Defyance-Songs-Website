-- Migration: Add font_size to setlists
ALTER TABLE setlists ADD COLUMN font_size TEXT DEFAULT 'small';
