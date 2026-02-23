-- Add event_id to blog_posts table
ALTER TABLE blog_posts ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE SET NULL;
