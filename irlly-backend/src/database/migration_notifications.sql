-- Migration: Add Notifications System
-- This creates a simple notification system for friend requests and other events

-- 1. Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'meetup_invite', 'rsvp_update')),
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Store additional data like contact_id, meetup_id, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- 3. Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 4. Add updated_at trigger
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Create function to create a friend request notification
CREATE OR REPLACE FUNCTION create_friend_request_notification(
    target_user_id UUID,
    from_user_id UUID,
    from_username TEXT,
    from_name TEXT
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        from_user_id,
        type,
        title,
        message,
        data
    ) VALUES (
        target_user_id,
        from_user_id,
        'friend_request',
        'New Friend Request',
        from_name || ' (@' || from_username || ') added you as a contact!',
        json_build_object('from_username', from_username, 'from_name', from_name)
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION create_friend_request_notification(UUID, UUID, TEXT, TEXT) TO authenticated;