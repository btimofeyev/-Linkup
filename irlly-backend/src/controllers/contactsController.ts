import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse, Contact } from '../types';

export const syncContacts = [
  // Validation
  body('contacts')
    .isArray()
    .withMessage('Contacts must be an array'),
  body('contacts.*.name')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Contact name is required and must be less than 100 characters'),
  body('contacts.*.phoneNumber')
    .isMobilePhone('any')
    .withMessage('Invalid phone number format'),

  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          data: errors.array()
        });
        return;
      }

      const userId = req.user!.id;
      const { contacts } = req.body;

      // Process contacts in batches
      const contactsToInsert = [];
      const phoneNumbers = contacts.map((c: any) => c.phoneNumber);

      // Check which phone numbers belong to registered users
      const { data: registeredUsers } = await supabase
        .from('users')
        .select('phone_number, id')
        .in('phone_number', phoneNumbers);

      const registeredMap = new Map(
        registeredUsers?.map(u => [u.phone_number, u.id]) || []
      );

      for (const contact of contacts) {
        const isRegistered = registeredMap.has(contact.phoneNumber);
        const contactUserId = registeredMap.get(contact.phoneNumber);

        contactsToInsert.push({
          user_id: userId,
          contact_user_id: contactUserId || null,
          name: contact.name,
          phone_number: contact.phoneNumber,
          is_registered: isRegistered
        });
      }

      // Delete existing contacts and insert new ones
      await supabase
        .from('contacts')
        .delete()
        .eq('user_id', userId);

      const { data: insertedContacts, error: insertError } = await supabase
        .from('contacts')
        .insert(contactsToInsert)
        .select();

      if (insertError) {
        console.error('Error inserting contacts:', insertError);
        res.status(500).json({
          success: false,
          error: 'Failed to sync contacts'
        });
        return;
      }

      res.json({
        success: true,
        data: { contacts: insertedContacts },
        message: `Synced ${insertedContacts?.length || 0} contacts`
      });
    } catch (error) {
      console.error('Sync contacts error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const getContacts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch contacts'
      });
      return;
    }

    res.json({
      success: true,
      data: { contacts }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getRegisteredContacts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        *,
        contact_user:contact_user_id (
          id,
          name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .eq('is_registered', true)
      .order('name');

    if (error) {
      console.error('Error fetching registered contacts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch registered contacts'
      });
      return;
    }

    res.json({
      success: true,
      data: { contacts }
    });
  } catch (error) {
    console.error('Get registered contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};