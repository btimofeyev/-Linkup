-- Migration: Add Username Support
-- This updates the schema to support username-based authentication and contact management

-- 1. Add username column to users table
ALTER TABLE users 
ADD COLUMN username VARCHAR(30) UNIQUE,
ADD COLUMN email VARCHAR(255);

-- 2. Make phone_number optional (some users may not want to provide it)
ALTER TABLE users 
ALTER COLUMN phone_number DROP NOT NULL;

-- 3. Update contacts table to support username-based connections
ALTER TABLE contacts 
ADD COLUMN username VARCHAR(30),
ADD COLUMN email VARCHAR(255);

-- 4. Make phone_number optional in contacts as well
ALTER TABLE contacts 
ALTER COLUMN phone_number DROP NOT NULL;

-- 5. Update the unique constraint to allow multiple ways to identify contacts
ALTER TABLE contacts 
DROP CONSTRAINT contacts_user_id_phone_number_key;

-- 6. Add new unique constraint that works with usernames
ALTER TABLE contacts 
ADD CONSTRAINT contacts_user_contact_unique 
UNIQUE(user_id, contact_user_id);

-- 7. Add indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_contacts_username ON contacts(username);
CREATE INDEX idx_users_email ON users(email);

-- 8. Add username validation function
CREATE OR REPLACE FUNCTION validate_username(username_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Username must be 3-30 characters, alphanumeric and underscores only
    RETURN username_input ~ '^[a-zA-Z0-9_]{3,30}$';
END;
$$ LANGUAGE plpgsql;

-- 9. Add check constraint for username format
ALTER TABLE users 
ADD CONSTRAINT username_format_check 
CHECK (username IS NULL OR validate_username(username));

-- 10. Update RLS policies to work with username searches
CREATE POLICY "Users can search by username" ON users
    FOR SELECT USING (username IS NOT NULL);

-- 11. Create a function to search users by username (for adding contacts)
CREATE OR REPLACE FUNCTION search_users_by_username(search_term TEXT, requesting_user_id UUID)
RETURNS TABLE (
    id UUID,
    username VARCHAR(30),
    name VARCHAR(100),
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.username, u.name, u.avatar_url
    FROM users u
    WHERE u.username ILIKE '%' || search_term || '%'
    AND u.id != requesting_user_id
    AND u.username IS NOT NULL
    ORDER BY 
        CASE WHEN u.username = search_term THEN 1 ELSE 2 END,
        LENGTH(u.username),
        u.username
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION search_users_by_username(TEXT, UUID) TO authenticated;