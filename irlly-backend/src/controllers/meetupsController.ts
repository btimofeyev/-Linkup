import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { supabase } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse, ScheduledMeetup } from '../types';

export const createMeetup = [
  // Validation
  body('title')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Title is required and must be less than 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('emoji')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Emoji must be less than 10 characters'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address must be less than 200 characters'),
  body('scheduledFor')
    .isISO8601()
    .withMessage('Invalid scheduled date format'),
  body('circleIds')
    .isArray({ min: 1 })
    .withMessage('At least one circle must be selected'),

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
      const { title, description, emoji, latitude, longitude, address, scheduledFor, circleIds } = req.body;

      // Validate that scheduled time is in the future
      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate <= new Date()) {
        res.status(400).json({
          success: false,
          error: 'Scheduled time must be in the future'
        });
        return;
      }

      // Create meetup
      const { data: meetup, error: meetupError } = await supabase
        .from('scheduled_meetups')
        .insert({
          user_id: userId,
          title,
          description,
          emoji,
          latitude,
          longitude,
          address,
          scheduled_for: scheduledFor
        })
        .select()
        .single();

      if (meetupError) {
        console.error('Error creating meetup:', meetupError);
        res.status(500).json({
          success: false,
          error: 'Failed to create meetup'
        });
        return;
      }

      // Associate meetup with circles
      const meetupCircles = circleIds.map((circleId: string) => ({
        meetup_id: meetup.id,
        circle_id: circleId
      }));

      const { error: circlesError } = await supabase
        .from('meetup_circles')
        .insert(meetupCircles);

      if (circlesError) {
        console.error('Error associating meetup with circles:', circlesError);
        // Don't fail the request, just log the error
      }

      res.status(201).json({
        success: true,
        data: { meetup: { ...meetup, circles: circleIds } }
      });
    } catch (error) {
      console.error('Create meetup error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const getMeetups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get meetups that are:
    // 1. Created by the user, OR
    // 2. Visible to the user through their circles
    const { data: meetups, error } = await supabase
      .from('scheduled_meetups')
      .select(`
        *,
        meetup_circles (
          circle_id
        ),
        creator:user_id (
          id,
          name,
          phone_number,
          avatar_url
        )
      `)
      .gte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error('Error fetching meetups:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch meetups'
      });
      return;
    }

    // Get circles where the user is a member or owner
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

    const accessibleMeetups = meetups?.filter(meetup => {
      // User can see their own meetups
      if (meetup.user_id === userId) return true;

      // User can see meetups shared with their circles
      return meetup.meetup_circles?.some((mc: any) => userCircleIds.has(mc.circle_id));
    });

    // Transform the data
    const transformedMeetups = accessibleMeetups?.map(meetup => ({
      ...meetup,
      circles: meetup.meetup_circles?.map((mc: any) => mc.circle_id) || []
    }));

    res.json({
      success: true,
      data: { meetups: transformedMeetups }
    });
  } catch (error) {
    console.error('Get meetups error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updateMeetup = [
  param('meetupId')
    .isUUID()
    .withMessage('Invalid meetup ID'),
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('scheduledFor')
    .optional()
    .isISO8601()
    .withMessage('Invalid scheduled date format'),

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
      const { title, description, scheduledFor } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (scheduledFor !== undefined) {
        const scheduledDate = new Date(scheduledFor);
        if (scheduledDate <= new Date()) {
          res.status(400).json({
            success: false,
            error: 'Scheduled time must be in the future'
          });
          return;
        }
        updateData.scheduled_for = scheduledFor;
      }

      const { data: meetup, error } = await supabase
        .from('scheduled_meetups')
        .update(updateData)
        .eq('id', meetupId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating meetup:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update meetup'
        });
        return;
      }

      res.json({
        success: true,
        data: { meetup }
      });
    } catch (error) {
      console.error('Update meetup error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const deleteMeetup = [
  param('meetupId')
    .isUUID()
    .withMessage('Invalid meetup ID'),

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

      // Verify the user owns this meetup
      const { data: meetup, error: fetchError } = await supabase
        .from('scheduled_meetups')
        .select('id, user_id, title')
        .eq('id', meetupId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !meetup) {
        res.status(404).json({
          success: false,
          error: 'Meetup not found or you do not have permission to delete it'
        });
        return;
      }

      // Delete the meetup (this will cascade delete related meetup_circles and rsvps due to foreign key constraints)
      const { error } = await supabase
        .from('scheduled_meetups')
        .delete()
        .eq('id', meetupId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting meetup:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to delete meetup'
        });
        return;
      }

      console.log(`Meetup "${meetup.title}" (${meetupId}) cancelled by user ${userId}`);

      res.json({
        success: true,
        message: 'Meetup cancelled successfully'
      });
    } catch (error) {
      console.error('Delete meetup error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];