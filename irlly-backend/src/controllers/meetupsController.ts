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
      const { title, description, latitude, longitude, address, scheduledFor, circleIds } = req.body;

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

    // Filter meetups that user has access to
    const { data: userCircles } = await supabase
      .from('circles')
      .select('id')
      .eq('user_id', userId);

    const userCircleIds = new Set(userCircles?.map(c => c.id) || []);

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

      res.json({
        success: true,
        message: 'Meetup deleted successfully'
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