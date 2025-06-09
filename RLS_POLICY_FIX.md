# Fix Row Level Security (RLS) Policy Issue

## Problem
The profile creation is failing with error: `new row violates row-level security policy for table "users"`

This happens because the current RLS policy only allows users to SELECT/UPDATE their own data, but doesn't allow INSERT operations.

## Solution
Run this SQL in your Supabase SQL Editor to fix the RLS policies:

```sql
-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Create new comprehensive policies for users table
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- IMPORTANT: Add INSERT policy to allow profile creation
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Verify RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Check all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';
```

## Alternative: Temporarily disable RLS for testing
If you want to test without RLS first, you can temporarily disable it:

```sql
-- TEMPORARY: Disable RLS for testing (NOT recommended for production)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

## Recommended: Use the first solution
The first solution is better because it maintains security while allowing proper profile creation.

## After running the fix
1. Run the SQL above in Supabase SQL Editor
2. Try the profile setup again
3. It should now work properly