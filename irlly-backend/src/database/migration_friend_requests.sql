-- Migration: Add friend requests system
-- This migration adds a friend_requests table to implement mutual connections

-- Create friend requests table
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user ON friend_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user ON friend_requests(from_user_id, status);

-- Enable RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view friend requests involving them" ON friend_requests
    FOR SELECT USING (
        auth.uid()::text = from_user_id::text OR 
        auth.uid()::text = to_user_id::text
    );

CREATE POLICY "Users can create friend requests" ON friend_requests
    FOR INSERT WITH CHECK (auth.uid()::text = from_user_id::text);

CREATE POLICY "Users can update friend requests sent to them" ON friend_requests
    FOR UPDATE USING (auth.uid()::text = to_user_id::text);

-- Add updated_at trigger
CREATE TRIGGER update_friend_requests_updated_at 
    BEFORE UPDATE ON friend_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();