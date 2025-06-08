-- Migration: Username + Phone Hybrid Authentication
-- This creates a system where users have usernames but still verify via phone

-- 1. Make phone_number required again (for verification)
ALTER TABLE users 
ALTER COLUMN phone_number SET NOT NULL;

-- 2. Create unique constraint on both username and phone
-- This ensures each username maps to one phone and vice versa
ALTER TABLE users 
ADD CONSTRAINT users_username_phone_unique 
UNIQUE(username, phone_number);

-- 3. Update the auth flow table to track verification attempts
CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(30) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Add index for performance
CREATE INDEX idx_auth_sessions_username_phone ON auth_sessions(username, phone_number);
CREATE INDEX idx_auth_sessions_code ON auth_sessions(verification_code, expires_at);

-- 5. Update search function to show username in results
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
    AND u.phone_number IS NOT NULL  -- Only show verified users
    ORDER BY 
        CASE WHEN u.username = search_term THEN 1 ELSE 2 END,
        LENGTH(u.username),
        u.username
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to check if username + phone combo is valid for registration
CREATE OR REPLACE FUNCTION can_register_username_phone(username_input VARCHAR(30), phone_input VARCHAR(20))
RETURNS TABLE (
    can_register BOOLEAN,
    error_message TEXT,
    existing_user_id UUID
) AS $$
DECLARE
    existing_username_user UUID;
    existing_phone_user UUID;
BEGIN
    -- Check if username exists
    SELECT id INTO existing_username_user 
    FROM users 
    WHERE username = username_input;
    
    -- Check if phone exists
    SELECT id INTO existing_phone_user 
    FROM users 
    WHERE phone_number = phone_input;
    
    -- Case 1: Both username and phone exist and belong to same user
    IF existing_username_user IS NOT NULL AND existing_phone_user IS NOT NULL THEN
        IF existing_username_user = existing_phone_user THEN
            RETURN QUERY SELECT FALSE, 'User already exists with this username and phone'::TEXT, existing_username_user;
        ELSE
            RETURN QUERY SELECT FALSE, 'Username or phone number already taken'::TEXT, NULL::UUID;
        END IF;
    -- Case 2: Username exists but different phone
    ELSIF existing_username_user IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, 'Username already taken'::TEXT, NULL::UUID;
    -- Case 3: Phone exists but different username  
    ELSIF existing_phone_user IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, 'Phone number already registered'::TEXT, NULL::UUID;
    -- Case 4: Both are available
    ELSE
        RETURN QUERY SELECT TRUE, 'Available'::TEXT, NULL::UUID;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION can_register_username_phone(VARCHAR(30), VARCHAR(20)) TO authenticated;