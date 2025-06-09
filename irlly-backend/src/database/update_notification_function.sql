-- Update the create_friend_request_notification function to actually create notifications

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