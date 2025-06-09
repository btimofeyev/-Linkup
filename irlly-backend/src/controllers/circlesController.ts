import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { supabase } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse, Circle } from '../types';

export const createCircle = [
  // Validation
  body('name')
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Circle name is required and must be less than 50 characters'),
  body('emoji')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Emoji must be less than 10 characters'),
  body('contactIds')
    .optional()
    .isArray()
    .withMessage('Contact IDs must be an array'),

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
      const { name, emoji, contactIds = [] } = req.body;

      // Create circle
      const { data: circle, error: circleError } = await supabase
        .from('circles')
        .insert({
          user_id: userId,
          name,
          emoji
        })
        .select()
        .single();

      if (circleError) {
        console.error('Error creating circle:', circleError);
        res.status(500).json({
          success: false,
          error: 'Failed to create circle'
        });
        return;
      }

      // Add members if provided
      if (contactIds.length > 0) {
        const members = contactIds.map((contactId: string) => ({
          circle_id: circle.id,
          contact_id: contactId
        }));

        const { error: membersError } = await supabase
          .from('circle_members')
          .insert(members);

        if (membersError) {
          console.error('Error adding circle members:', membersError);
          // Don't fail the request, just log the error
        }
      }

      res.status(201).json({
        success: true,
        data: { circle }
      });
    } catch (error) {
      console.error('Create circle error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const getCircles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const { data: circles, error } = await supabase
      .from('circles')
      .select(`
        *,
        circle_members (
          contact:contact_id (
            id,
            name,
            phone_number,
            is_registered
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at');

    if (error) {
      console.error('Error fetching circles:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch circles'
      });
      return;
    }

    // Transform the data to include members array
    const transformedCircles = circles?.map(circle => ({
      ...circle,
      members: circle.circle_members?.map((cm: any) => cm.contact) || []
    }));

    res.json({
      success: true,
      data: { circles: transformedCircles }
    });
  } catch (error) {
    console.error('Get circles error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updateCircle = [
  // Validation
  param('circleId')
    .isUUID()
    .withMessage('Invalid circle ID'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Circle name must be between 1 and 50 characters'),
  body('emoji')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Emoji must be less than 10 characters'),

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
      const { circleId } = req.params;
      const { name, emoji } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (emoji !== undefined) updateData.emoji = emoji;

      const { data: circle, error } = await supabase
        .from('circles')
        .update(updateData)
        .eq('id', circleId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating circle:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update circle'
        });
        return;
      }

      res.json({
        success: true,
        data: { circle }
      });
    } catch (error) {
      console.error('Update circle error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const deleteCircle = [
  param('circleId')
    .isUUID()
    .withMessage('Invalid circle ID'),

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
      const { circleId } = req.params;

      const { error } = await supabase
        .from('circles')
        .delete()
        .eq('id', circleId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting circle:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to delete circle'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Circle deleted successfully'
      });
    } catch (error) {
      console.error('Delete circle error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const addContactsToCircle = [
  param('circleId')
    .isUUID()
    .withMessage('Invalid circle ID'),
  body('contactIds')
    .isArray()
    .withMessage('Contact IDs must be an array'),

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
      const { circleId } = req.params;
      const { contactIds } = req.body;

      // Verify circle ownership
      const { data: circle, error: circleError } = await supabase
        .from('circles')
        .select('id')
        .eq('id', circleId)
        .eq('user_id', userId)
        .single();

      if (circleError || !circle) {
        res.status(404).json({
          success: false,
          error: 'Circle not found'
        });
        return;
      }

      // Verify that the contact IDs exist in the contacts table
      const { data: existingContacts, error: contactCheckError } = await supabase
        .from('contacts')
        .select('id, name, username, contact_user_id')
        .in('id', contactIds)
        .eq('user_id', userId);

      if (contactCheckError) {
        console.error('Error checking contact existence:', contactCheckError);
      } else {
        console.log('Backend: Existing contacts found:', existingContacts?.length || 0, 'of', contactIds.length);
        console.log('Backend: Contact details:', existingContacts);
      }

      // Add members
      const members = contactIds.map((contactId: string) => ({
        circle_id: circleId,
        contact_id: contactId
      }));

      console.log('Backend: Attempting to add circle members:', {
        circleId,
        contactIds,
        members
      });

      const { error: membersError } = await supabase
        .from('circle_members')
        .upsert(members, { onConflict: 'circle_id,contact_id' });

      if (membersError) {
        console.error('Error adding circle members:', membersError);
        res.status(500).json({
          success: false,
          error: 'Failed to add contacts to circle'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Contacts added to circle successfully'
      });
    } catch (error) {
      console.error('Add contacts to circle error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const removeContactFromCircle = [
  param('circleId')
    .isUUID()
    .withMessage('Invalid circle ID'),
  param('contactId')
    .isUUID()
    .withMessage('Invalid contact ID'),

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
      const { circleId, contactId } = req.params;

      // Verify circle ownership
      const { data: circle, error: circleError } = await supabase
        .from('circles')
        .select('id')
        .eq('id', circleId)
        .eq('user_id', userId)
        .single();

      if (circleError || !circle) {
        res.status(404).json({
          success: false,
          error: 'Circle not found'
        });
        return;
      }

      // Remove member
      const { error } = await supabase
        .from('circle_members')
        .delete()
        .eq('circle_id', circleId)
        .eq('contact_id', contactId);

      if (error) {
        console.error('Error removing circle member:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to remove contact from circle'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Contact removed from circle successfully'
      });
    } catch (error) {
      console.error('Remove contact from circle error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];