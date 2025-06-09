-- IRLly Database Schema for Supabase
-- Run this SQL in your Supabase SQL editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    name VARCHAR(100),
    username VARCHAR(30) UNIQUE NOT NULL,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    username VARCHAR(30),
    is_registered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, phone_number),
    UNIQUE(user_id, username)
);

-- Circles table
CREATE TABLE circles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    emoji VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Circle members junction table
CREATE TABLE circle_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(circle_id, contact_id)
);

-- Pins table (spontaneous meetups)
CREATE TABLE pins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    note TEXT,
    emoji VARCHAR(10),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pin visibility junction table
CREATE TABLE pin_circles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
    circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pin_id, circle_id)
);

-- Scheduled meetups table
CREATE TABLE scheduled_meetups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    emoji VARCHAR(10),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetup visibility junction table
CREATE TABLE meetup_circles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meetup_id UUID NOT NULL REFERENCES scheduled_meetups(id) ON DELETE CASCADE,
    circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meetup_id, circle_id)
);

-- RSVPs table (for both pins and scheduled meetups)
CREATE TABLE rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meetup_id UUID NOT NULL,
    meetup_type VARCHAR(20) NOT NULL CHECK (meetup_type IN ('pin', 'scheduled')),
    response VARCHAR(20) NOT NULL CHECK (response IN ('attending', 'not_attending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, meetup_id, meetup_type)
);

-- Friend requests table
CREATE TABLE friend_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

-- Verification codes table (for phone number verification)
CREATE TABLE verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_phone_number ON contacts(phone_number);
CREATE INDEX idx_contacts_username ON contacts(username);
CREATE INDEX idx_circles_user_id ON circles(user_id);
CREATE INDEX idx_circle_members_circle_id ON circle_members(circle_id);
CREATE INDEX idx_circle_members_contact_id ON circle_members(contact_id);
CREATE INDEX idx_pins_user_id ON pins(user_id);
CREATE INDEX idx_pins_active ON pins(is_active, expires_at);
CREATE INDEX idx_pins_location ON pins(latitude, longitude);
CREATE INDEX idx_pin_circles_pin_id ON pin_circles(pin_id);
CREATE INDEX idx_pin_circles_circle_id ON pin_circles(circle_id);
CREATE INDEX idx_scheduled_meetups_user_id ON scheduled_meetups(user_id);
CREATE INDEX idx_scheduled_meetups_time ON scheduled_meetups(scheduled_for);
CREATE INDEX idx_meetup_circles_meetup_id ON meetup_circles(meetup_id);
CREATE INDEX idx_meetup_circles_circle_id ON meetup_circles(circle_id);
CREATE INDEX idx_rsvps_user_id ON rsvps(user_id);
CREATE INDEX idx_rsvps_meetup ON rsvps(meetup_id, meetup_type);
CREATE INDEX idx_verification_codes_phone ON verification_codes(phone_number, expires_at);
CREATE INDEX idx_friend_requests_to_user ON friend_requests(to_user_id, status);
CREATE INDEX idx_friend_requests_from_user ON friend_requests(from_user_id, status);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetup_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Contacts policies
CREATE POLICY "Users can view their own contacts" ON contacts
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Circles policies
CREATE POLICY "Users can manage their own circles" ON circles
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage their circle members" ON circle_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM circles 
            WHERE circles.id = circle_members.circle_id 
            AND circles.user_id::text = auth.uid()::text
        )
    );

-- Pins policies
CREATE POLICY "Users can manage their own pins" ON pins
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view pins they have access to" ON pins
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR
        EXISTS (
            SELECT 1 FROM pin_circles pc
            JOIN circles c ON c.id = pc.circle_id
            JOIN circle_members cm ON cm.circle_id = c.id
            JOIN contacts con ON con.id = cm.contact_id
            WHERE pc.pin_id = pins.id 
            AND con.contact_user_id::text = auth.uid()::text
        )
    );

-- Scheduled meetups policies  
CREATE POLICY "Users can manage their own meetups" ON scheduled_meetups
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view meetups they have access to" ON scheduled_meetups
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR
        EXISTS (
            SELECT 1 FROM meetup_circles mc
            JOIN circles c ON c.id = mc.circle_id
            JOIN circle_members cm ON cm.circle_id = c.id
            JOIN contacts con ON con.id = cm.contact_id
            WHERE mc.meetup_id = scheduled_meetups.id 
            AND con.contact_user_id::text = auth.uid()::text
        )
    );

-- RSVP policies
CREATE POLICY "Users can manage their own RSVPs" ON rsvps
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Friend request policies
CREATE POLICY "Users can view friend requests involving them" ON friend_requests
    FOR SELECT USING (
        auth.uid()::text = from_user_id::text OR 
        auth.uid()::text = to_user_id::text
    );

CREATE POLICY "Users can create friend requests" ON friend_requests
    FOR INSERT WITH CHECK (auth.uid()::text = from_user_id::text);

CREATE POLICY "Users can update friend requests sent to them" ON friend_requests
    FOR UPDATE USING (auth.uid()::text = to_user_id::text);

-- Functions for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_circles_updated_at BEFORE UPDATE ON circles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pins_updated_at BEFORE UPDATE ON pins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_meetups_updated_at BEFORE UPDATE ON scheduled_meetups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON rsvps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON friend_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();