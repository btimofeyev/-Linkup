-- Migration to update users table for email authentication and add username search functionality

-- Add email and username columns to users table (if not exists)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS username VARCHAR(30) UNIQUE;

-- Make email required and phone_number optional
ALTER TABLE users 
ALTER COLUMN phone_number DROP NOT NULL,
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN username SET NOT NULL;

-- Add username column to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS username VARCHAR(30);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_contacts_username ON contacts(username);

-- Add unique constraint for username in contacts
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'contacts_user_id_username_key'
    ) THEN
        ALTER TABLE contacts ADD CONSTRAINT contacts_user_id_username_key UNIQUE(user_id, username);
    END IF;
END $$;

-- Function to search users by username
CREATE OR REPLACE FUNCTION search_users_by_username(
    search_term TEXT,
    requesting_user_id UUID
) RETURNS TABLE (
    id UUID,
    username VARCHAR(30),
    name VARCHAR(100),
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.name,
        u.avatar_url
    FROM users u
    WHERE 
        u.username ILIKE '%' || search_term || '%'
        AND u.id != requesting_user_id
        AND u.username IS NOT NULL
    ORDER BY 
        CASE 
            WHEN u.username ILIKE search_term || '%' THEN 1
            ELSE 2
        END,
        u.username
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create friend request notification
CREATE OR REPLACE FUNCTION create_friend_request_notification(
    target_user_id UUID,
    from_user_id UUID,
    from_username VARCHAR(30),
    from_name VARCHAR(100)
) RETURNS VOID AS $$
BEGIN
    -- This is a placeholder function that can be extended
    -- to integrate with your notification system
    -- For now, it just logs the notification
    RAISE NOTICE 'Friend request notification: % (%) wants to add % as a friend', from_name, from_username, target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;