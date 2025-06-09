# Database Migration Instructions

## Issue
The email authentication flow is failing because the database schema doesn't have the required `email` and `username` columns in the `users` table.

## How to Fix

### Option 1: Run Migration in Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the migration SQL file: `irlly-backend/src/database/migration_add_username_search.sql`

### Option 2: Quick Fix - Run this SQL directly in Supabase SQL Editor:

```sql
-- Add email and username columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS username VARCHAR(30);

-- Make phone_number optional
ALTER TABLE users 
ALTER COLUMN phone_number DROP NOT NULL;

-- Add unique constraints
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE(email);
ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE(username);

-- Make email and username required
ALTER TABLE users 
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN username SET NOT NULL;

-- Add username to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS username VARCHAR(30);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_contacts_username ON contacts(username);
```

### Option 3: If you have existing data, use this safer version:

```sql
-- Check current table structure first
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users';

-- If email/username columns don't exist, add them
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS username VARCHAR(30);

-- Make phone_number optional
ALTER TABLE users 
ALTER COLUMN phone_number DROP NOT NULL;
```

## After Running Migration
1. Test the profile setup flow again
2. You should see detailed logs in the console showing the profile creation process
3. The error should be resolved

## Verification
After running the migration, you can verify it worked by running:
```sql
\d users
```
This should show the email and username columns in the users table.