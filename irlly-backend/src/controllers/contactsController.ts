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
          username,
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

export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { q: searchTerm } = req.query;

    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length < 2) {
      res.status(400).json({
        success: false,
        error: 'Search term must be at least 2 characters'
      });
      return;
    }

    const { data: users, error } = await supabase
      .rpc('search_users_by_username', {
        search_term: searchTerm.trim(),
        requesting_user_id: userId
      });

    if (error) {
      console.error('Error searching users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search users'
      });
      return;
    }

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getFriends = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get all contacts that are registered users (friends on the app)
    const { data: friends, error } = await supabase
      .from('contacts')
      .select(`
        *,
        contact_user:contact_user_id (
          id,
          name,
          username,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .eq('is_registered', true)
      .not('contact_user_id', 'is', null)
      .order('name');

    if (error) {
      console.error('Error fetching friends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch friends'
      });
      return;
    }

    res.json({
      success: true,
      data: { friends }
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const addContactByUsername = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]{3,30}$/)
    .withMessage('Invalid username format'),

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
      const { username } = req.body;

      // Find the user by username
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id, username, name, avatar_url')
        .eq('username', username)
        .single();

      if (userError || !targetUser) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      if (targetUser.id === userId) {
        res.status(400).json({
          success: false,
          error: 'Cannot add yourself as a contact'
        });
        return;
      }

      // Check if already a contact
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId)
        .eq('contact_user_id', targetUser.id)
        .single();

      if (existingContact) {
        res.status(400).json({
          success: false,
          error: 'User is already in your contacts'
        });
        return;
      }

      // Add as contact
      const { data: newContact, error: insertError } = await supabase
        .from('contacts')
        .insert({
          user_id: userId,
          contact_user_id: targetUser.id,
          name: targetUser.name || targetUser.username,
          username: targetUser.username,
          is_registered: true
        })
        .select(`
          *,
          contact_user:contact_user_id (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .single();

      if (insertError) {
        console.error('Error adding contact:', insertError);
        res.status(500).json({
          success: false,
          error: 'Failed to add contact'
        });
        return;
      }

      // Create notification for the target user
      try {
        const { data: fromUser } = await supabase
          .from('users')
          .select('username, name')
          .eq('id', userId)
          .single();

        if (fromUser) {
          await supabase.rpc('create_friend_request_notification', {
            target_user_id: targetUser.id,
            from_user_id: userId,
            from_username: fromUser.username,
            from_name: fromUser.name || fromUser.username
          });
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the main operation if notification fails
      }
      
      res.json({
        success: true,
        data: { contact: newContact },
        message: `Added ${targetUser.username} to your contacts`
      });
    } catch (error) {
      console.error('Add contact error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];