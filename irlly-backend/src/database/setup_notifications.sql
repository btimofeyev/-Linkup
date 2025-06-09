-- Setup notifications table and function for IRLly

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Apply updated_at trigger for notifications
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create the friend request notification function
CREATE OR REPLACE FUNCTION create_friend_request_notification(
    target_user_id UUID,
    from_user_id UUID,
    from_username VARCHAR(30),
    from_name VARCHAR(100)
) RETURNS VOID AS $$
BEGIN
    -- Insert notification record into notifications table
    INSERT INTO notifications (
        user_id,
        from_user_id,
        type,
        title,
        message,
        data,
        is_read,
        created_at
    ) VALUES (
        target_user_id,
        from_user_id,
        'friend_request',
        'New Friend Request',
        from_name || ' (@' || from_username || ') added you as a contact',
        jsonb_build_object(
            'from_user_id', from_user_id,
            'from_username', from_username,
            'from_name', from_name
        ),
        false,
        NOW()
    );
    
    -- Also log for debugging
    RAISE NOTICE 'Created friend request notification: % (%) added % as a contact', from_name, from_username, target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;