import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { supabase } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse, RSVP } from '../types';

export const createOrUpdateRSVP = [
  // Validation
  body('meetupId')
    .isUUID()
    .withMessage('Invalid meetup ID'),
  body('meetupType')
    .isIn(['pin', 'scheduled'])
    .withMessage('Meetup type must be pin or scheduled'),
  body('response')
    .isIn(['attending', 'not_attending'])
    .withMessage('Response must be attending or not_attending'),

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
      const { meetupId, meetupType, response } = req.body;

      // Verify the meetup exists and user has access
      const tableName = meetupType === 'pin' ? 'pins' : 'scheduled_meetups';
      const circleTableName = meetupType === 'pin' ? 'pin_circles' : 'meetup_circles';
      const joinColumn = meetupType === 'pin' ? 'pin_id' : 'meetup_id';

      const { data: meetup, error: meetupError } = await supabase
        .from(tableName)
        .select(`
          id,
          user_id,
          ${circleTableName} (
            circle_id
          )
        `)
        .eq('id', meetupId)
        .single();

      if (meetupError || !meetup) {
        res.status(404).json({
          success: false,
          error: 'Meetup not found'
        });
        return;
      }

      // Check if user has access to this meetup
      let hasAccess = meetup.user_id === userId; // Creator always has access

      if (!hasAccess) {
        // Check if user is a member of any circles this meetup is shared with
        // First, find the user's contact records
        const { data: userContacts } = await supabase
          .from('contacts')
          .select('id')
          .eq('contact_user_id', userId);

        const userContactIds = userContacts?.map(c => c.id) || [];

        // Get circles where any of the user's contact records are members
        let userMemberships: any[] = [];
        if (userContactIds.length > 0) {
          const { data: memberships } = await supabase
            .from('circle_members')
            .select('circle_id')
            .in('contact_id', userContactIds);
          userMemberships = memberships || [];
        }

        // Also get circles the user owns
        const { data: ownedCircles } = await supabase
          .from('circles')
          .select('id')
          .eq('user_id', userId);

        const memberCircleIds = userMemberships.map(m => m.circle_id);
        const ownedCircleIds = ownedCircles?.map(c => c.id) || [];
        const userCircleIds = new Set([...memberCircleIds, ...ownedCircleIds]);

        const meetupCircleIds = (meetup as any)[circleTableName]?.map((c: any) => c.circle_id) || [];

        hasAccess = meetupCircleIds.some((circleId: any) => userCircleIds.has(circleId));

        console.log(`🎯 RSVP Access Check for user ${userId}:`, {
          meetupId,
          meetupType,
          meetupCircleIds,
          userCircleIds: Array.from(userCircleIds),
          hasAccess
        });
      }

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      // Create or update RSVP
      const { data: rsvp, error: rsvpError } = await supabase
        .from('rsvps')
        .upsert({
          user_id: userId,
          meetup_id: meetupId,
          meetup_type: meetupType,
          response
        }, {
          onConflict: 'user_id,meetup_id,meetup_type'
        })
        .select()
        .single();

      if (rsvpError) {
        console.error('Error creating/updating RSVP:', rsvpError);
        res.status(500).json({
          success: false,
          error: 'Failed to update RSVP'
        });
        return;
      }

      res.json({
        success: true,
        data: { rsvp }
      });
    } catch (error) {
      console.error('Create/update RSVP error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const getRSVPs = [
  query('meetupId')
    .isUUID()
    .withMessage('Invalid meetup ID'),
  query('meetupType')
    .isIn(['pin', 'scheduled'])
    .withMessage('Meetup type must be pin or scheduled'),

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

      const { meetupId, meetupType } = req.query;

      const { data: rsvps, error } = await supabase
        .from('rsvps')
        .select(`
          *,
          user:user_id (
            id,
            name,
            phone_number,
            avatar_url
          )
        `)
        .eq('meetup_id', meetupId as string)
        .eq('meetup_type', meetupType as string)
        .order('created_at');

      if (error) {
        console.error('Error fetching RSVPs:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch RSVPs'
        });
        return;
      }

      res.json({
        success: true,
        data: { rsvps }
      });
    } catch (error) {
      console.error('Get RSVPs error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const getUserRSVP = [
  param('meetupId')
    .isUUID()
    .withMessage('Invalid meetup ID'),
  query('meetupType')
    .isIn(['pin', 'scheduled'])
    .withMessage('Meetup type must be pin or scheduled'),

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
      const { meetupId } = req.params;
      const { meetupType } = req.query;

      const { data: rsvp, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('user_id', userId)
        .eq('meetup_id', meetupId)
        .eq('meetup_type', meetupType as string)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user RSVP:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch RSVP'
        });
        return;
      }

      res.json({
        success: true,
        data: { rsvp: rsvp || null }
      });
    } catch (error) {
      console.error('Get user RSVP error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const deleteRSVP = [
  param('meetupId')
    .isUUID()
    .withMessage('Invalid meetup ID'),
  query('meetupType')
    .isIn(['pin', 'scheduled'])
    .withMessage('Meetup type must be pin or scheduled'),

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
      const { meetupId } = req.params;
      const { meetupType } = req.query;

      const { error } = await supabase
        .from('rsvps')
        .delete()
        .eq('user_id', userId)
        .eq('meetup_id', meetupId)
        .eq('meetup_type', meetupType as string);

      if (error) {
        console.error('Error deleting RSVP:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to delete RSVP'
        });
        return;
      }

      res.json({
        success: true,
        message: 'RSVP deleted successfully'
      });
    } catch (error) {
      console.error('Delete RSVP error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];