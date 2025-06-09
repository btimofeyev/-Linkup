# Clean Up Duplicate Users Issue

## Problem
The user ID `ecd624f1-fb71-45f6-b84a-3874e26f463d` already exists in the database but with incomplete data (no email/username), causing a primary key violation when trying to create the profile.

## Quick Solution
I've updated the code to handle this automatically by attempting an UPDATE if INSERT fails with a primary key violation.

## Manual Cleanup (if needed)
If you want to clean up the database manually, run this SQL in Supabase:

### Option 1: Check what user records exist
```sql
-- See all user records for this user ID
SELECT id, email, username, name, phone_number, is_verified, created_at 
FROM users 
WHERE id = 'ecd624f1-fb71-45f6-b84a-3874e26f463d';
```

### Option 2: Delete incomplete user record (if exists)
```sql
-- CAUTION: This will delete the user record completely
-- Only run this if the user record is incomplete/corrupted
DELETE FROM users 
WHERE id = 'ecd624f1-fb71-45f6-b84a-3874e26f463d' 
AND (email IS NULL OR username IS NULL);
```

### Option 3: Update existing record manually
```sql
-- Update the existing record with profile data
UPDATE users 
SET 
    email = 'gamedesknews@gmail.com',
    username = 'your_desired_username',
    name = 'Your Name',
    is_verified = true,
    updated_at = NOW()
WHERE id = 'ecd624f1-fb71-45f6-b84a-3874e26f463d';
```

## Recommended Action
**Just try the profile setup again!** The updated code should now handle this automatically by updating the existing record instead of trying to insert a new one.

## Prevention
This issue happened because of the database migration timing. Going forward, the code will handle both INSERT (new users) and UPDATE (existing incomplete records) scenarios.