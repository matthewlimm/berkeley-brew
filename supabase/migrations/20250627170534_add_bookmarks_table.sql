-- Create bookmarks table
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only bookmark a cafe once
  CONSTRAINT unique_user_cafe_bookmark UNIQUE (user_id, cafe_id)
);

-- Create indexes for faster queries
CREATE INDEX bookmarks_user_id_idx ON bookmarks(user_id);
CREATE INDEX bookmarks_cafe_id_idx ON bookmarks(cafe_id);

-- Add RLS policies for bookmarks table
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to insert their own bookmarks
CREATE POLICY insert_bookmark_policy ON bookmarks 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own bookmarks
CREATE POLICY delete_bookmark_policy ON bookmarks 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Policy to allow users to select their own bookmarks
CREATE POLICY select_bookmark_policy ON bookmarks 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);
