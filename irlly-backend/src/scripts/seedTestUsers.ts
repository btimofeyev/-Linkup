import { supabase } from '../config/database';

// Test users with fake but realistic phone numbers
const testUsers = [
  {
    phone_number: '+1234567890',
    name: 'Test User 1',
    verification_code: '123456',
    is_verified: true
  },
  {
    phone_number: '+1234567891', 
    name: 'Test User 2',
    verification_code: '123456',
    is_verified: true
  },
  {
    phone_number: '+1234567892',
    name: 'Test User 3', 
    verification_code: '123456',
    is_verified: true
  }
];

export async function seedTestUsers() {
  try {
    console.log('Seeding test users...');
    
    const { data, error } = await supabase
      .from('users')
      .upsert(testUsers, { onConflict: 'phone_number' })
      .select();

    if (error) {
      console.error('Error seeding test users:', error);
      return;
    }

    console.log('Test users seeded successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in seedTestUsers:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedTestUsers();
}