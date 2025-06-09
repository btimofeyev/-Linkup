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

      console.log(`Backend: processing ${contacts.length} contacts for sync`);
      
      // Check existing username-based contacts before deletion
      const { data: existingUsernameContacts } = await supabase
        .from('contacts')
        .select('id, name, username')
        .eq('user_id', userId)
        .not('username', 'is', null);
      
      console.log(`Backend: preserving ${existingUsernameContacts?.length || 0} username-based contacts:`, 
        existingUsernameContacts?.map(c => c.username) || []);

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

      // Delete only phone-based contacts, preserve username-based contacts
      await supabase
        .from('contacts')
        .delete()
        .eq('user_id', userId)
        .is('username', null); // Only delete contacts that don't have usernames (phone-based contacts)

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

      console.log(`Backend: synced ${insertedContacts?.length || 0} contacts for user ${userId}`);

      // Return ALL contacts (both newly synced phone contacts and preserved username contacts)
      const { data: allContacts, error: allContactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (allContactsError) {
        console.error('Error fetching all contacts after sync:', allContactsError);
        // Fallback to just the inserted contacts
        res.json({
          success: true,
          data: { contacts: insertedContacts },
          message: `Synced ${insertedContacts?.length || 0} contacts`
        });
        return;
      }

      console.log(`Backend: returning ${allContacts?.length || 0} total contacts (${insertedContacts?.length || 0} synced + preserved username contacts)`);

      res.json({
        success: true,
        data: { contacts: allContacts },
        message: `Synced ${insertedContacts?.length || 0} contacts, total ${allContacts?.length || 0} contacts`
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

    console.log(`Backend: returning ${contacts?.length || 0} contacts for user ${userId}`);
    console.log('Backend: Registered contacts:', contacts?.filter(c => c.is_registered).length || 0);
    console.log('Backend: Username-based contacts:', contacts?.filter(c => c.username && c.is_registered).length || 0);

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

export const debugUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, name, email')
      .order('created_at');

    if (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch users' });
      return;
    }

    res.json({
      success: true,
      data: { users, requestingUserId: req.user!.id }
    });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const sendFriendRequest = [
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
          error: 'Cannot send friend request to yourself'
        });
        return;
      }

      // Check if already friends
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

      // Check if friend request already exists
      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('id, status')
        .eq('from_user_id', userId)
        .eq('to_user_id', targetUser.id)
        .single();

      if (existingRequest) {
        res.status(400).json({
          success: false,
          error: existingRequest.status === 'pending' 
            ? 'Friend request already sent' 
            : 'Friend request already processed'
        });
        return;
      }

      // Create friend request
      const { data: friendRequest, error: requestError } = await supabase
        .from('friend_requests')
        .insert({
          from_user_id: userId,
          to_user_id: targetUser.id,
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) {
        console.error('Error creating friend request:', requestError);
        res.status(500).json({
          success: false,
          error: 'Failed to send friend request'
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
          const functionResult = await supabase.rpc('create_friend_request_notification', {
            target_user_id: targetUser.id,
            from_user_id: userId,
            from_username: fromUser.username,
            from_name: fromUser.name || fromUser.username
          });
          
          if (functionResult.error) {
            const { data: notification, error: directError } = await supabase
              .from('notifications')
              .insert({
                user_id: targetUser.id,
                from_user_id: userId,
                type: 'friend_request',
                title: 'New Friend Request',
                message: `${fromUser.name || fromUser.username} (@${fromUser.username}) sent you a friend request`,
                data: {
                  from_user_id: userId,
                  from_username: fromUser.username,
                  from_name: fromUser.name || fromUser.username,
                  friend_request_id: friendRequest.id
                },
                is_read: false
              })
              .select()
              .single();
          }
        }
      } catch (notificationError) {
        console.error('Notification creation error:', notificationError);
      }
      
      res.json({
        success: true,
        data: { friendRequest },
        message: `Friend request sent to ${targetUser.username}`
      });
    } catch (error) {
      console.error('Send friend request error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const getFriendRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const { data: friendRequests, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        from_user:from_user_id (
          id,
          username,
          name,
          avatar_url
        )
      `)
      .eq('to_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching friend requests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch friend requests'
      });
      return;
    }

    res.json({
      success: true,
      data: { friendRequests }
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const respondToFriendRequest = [
  body('requestId')
    .isUUID()
    .withMessage('Invalid request ID'),
  body('action')
    .isIn(['accept', 'reject'])
    .withMessage('Action must be accept or reject'),

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
      const { requestId, action } = req.body;

      // Get the friend request
      const { data: friendRequest, error: requestError } = await supabase
        .from('friend_requests')
        .select(`
          *,
          from_user:from_user_id (
            id,
            username,
            name,
            avatar_url
          )
        `)
        .eq('id', requestId)
        .eq('to_user_id', userId)
        .eq('status', 'pending')
        .single();

      if (requestError || !friendRequest) {
        res.status(404).json({
          success: false,
          error: 'Friend request not found'
        });
        return;
      }

      // Update friend request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating friend request:', updateError);
        res.status(500).json({
          success: false,
          error: 'Failed to respond to friend request'
        });
        return;
      }

      if (action === 'accept') {
        // Add both users as contacts to each other
        const contactsToInsert = [
          {
            user_id: userId,
            contact_user_id: friendRequest.from_user_id,
            name: friendRequest.from_user.name || friendRequest.from_user.username,
            username: friendRequest.from_user.username,
            is_registered: true
          },
          {
            user_id: friendRequest.from_user_id,
            contact_user_id: userId,
            name: req.user!.name || req.user!.username,
            username: req.user!.username,
            is_registered: true
          }
        ];

        const { error: contactsError } = await supabase
          .from('contacts')
          .insert(contactsToInsert);

        if (contactsError) {
          console.error('Error adding mutual contacts:', contactsError);
          res.status(500).json({
            success: false,
            error: 'Failed to add contacts'
          });
          return;
        }
      }

      res.json({
        success: true,
        message: action === 'accept' 
          ? `Friend request accepted` 
          : `Friend request rejected`
      });
    } catch (error) {
      console.error('Respond to friend request error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];