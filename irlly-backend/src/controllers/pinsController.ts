import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { supabase } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse, Pin } from '../types';

export const createPin = [
  // Validation
  body('title')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Title is required and must be less than 100 characters'),
  body('note')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Note must be less than 500 characters'),
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
      const { title, note, emoji, latitude, longitude, address, circleIds } = req.body;

      // Set expiration to 4 hours from now
      const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);

      // Create pin
      const { data: pin, error: pinError } = await supabase
        .from('pins')
        .insert({
          user_id: userId,
          title,
          note,
          emoji,
          latitude,
          longitude,
          address,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (pinError) {
        console.error('Error creating pin:', pinError);
        res.status(500).json({
          success: false,
          error: 'Failed to create pin'
        });
        return;
      }

      // Associate pin with circles
      const pinCircles = circleIds.map((circleId: string) => ({
        pin_id: pin.id,
        circle_id: circleId
      }));

      const { error: circlesError } = await supabase
        .from('pin_circles')
        .insert(pinCircles);

      if (circlesError) {
        console.error('Error associating pin with circles:', circlesError);
        // Don't fail the request, just log the error
      }

      res.status(201).json({
        success: true,
        data: { pin: { ...pin, circles: circleIds } }
      });
    } catch (error) {
      console.error('Create pin error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const getPins = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get pins that are:
    // 1. Created by the user, OR
    // 2. Visible to the user through their circles
    const { data: pins, error } = await supabase
      .from('pins')
      .select(`
        *,
        pin_circles (
          circle_id
        ),
        creator:user_id (
          id,
          name,
          phone_number,
          avatar_url
        )
      `)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pins:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch pins'
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

    const accessiblePins = pins?.filter(pin => {
      // User can see their own pins
      if (pin.user_id === userId) return true;

      // User can see pins shared with their circles
      return pin.pin_circles?.some((pc: any) => userCircleIds.has(pc.circle_id));
    });

    // Transform the data
    const transformedPins = accessiblePins?.map(pin => ({
      ...pin,
      circles: pin.pin_circles?.map((pc: any) => pc.circle_id) || []
    }));

    res.json({
      success: true,
      data: { pins: transformedPins }
    });
  } catch (error) {
    console.error('Get pins error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updatePin = [
  param('pinId')
    .isUUID()
    .withMessage('Invalid pin ID'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

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
      const { pinId } = req.params;
      const { isActive } = req.body;

      const updateData: any = {};
      if (isActive !== undefined) updateData.is_active = isActive;

      const { data: pin, error } = await supabase
        .from('pins')
        .update(updateData)
        .eq('id', pinId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating pin:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update pin'
        });
        return;
      }

      res.json({
        success: true,
        data: { pin }
      });
    } catch (error) {
      console.error('Update pin error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const deletePin = [
  param('pinId')
    .isUUID()
    .withMessage('Invalid pin ID'),

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
      const { pinId } = req.params;

      const { error } = await supabase
        .from('pins')
        .delete()
        .eq('id', pinId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting pin:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to delete pin'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Pin deleted successfully'
      });
    } catch (error) {
      console.error('Delete pin error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];