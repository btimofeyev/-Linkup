import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/database';
import { sendVerificationCode, generateVerificationCode } from '../services/smsService';
import { generateAccessToken } from '../middleware/auth';
import { ApiResponse, User, VerificationCode } from '../types';

export const sendVerificationCodeHandler = [
  // Validation
  body('phoneNumber')
    .isMobilePhone('any')
    .withMessage('Invalid phone number format'),

  async (req: Request, res: Response): Promise<void> => {
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

      const { phoneNumber } = req.body;
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store verification code in database
      const { error: insertError } = await supabase
        .from('verification_codes')
        .insert({
          phone_number: phoneNumber,
          code,
          expires_at: expiresAt.toISOString()
        });

      if (insertError) {
        console.error('Error storing verification code:', insertError);
        res.status(500).json({
          success: false,
          error: 'Failed to send verification code'
        });
        return;
      }

      // Send SMS (or log in development)
      const smsSent = await sendVerificationCode(phoneNumber, code);
      
      if (!smsSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to send SMS'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Verification code sent successfully'
      });
    } catch (error) {
      console.error('Send verification code error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const verifyCodeAndLogin = [
  // Validation
  body('phoneNumber')
    .isMobilePhone('any')
    .withMessage('Invalid phone number format'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Code must be 6 digits'),

  async (req: Request, res: Response): Promise<void> => {
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

      const { phoneNumber, code } = req.body;

      // Verify code
      const { data: verificationData, error: verifyError } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('code', code)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (verifyError || !verificationData) {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired verification code'
        });
        return;
      }

      // Mark code as used
      await supabase
        .from('verification_codes')
        .update({ is_used: true })
        .eq('id', verificationData.id);

      // Check if user exists
      let { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      // Create user if doesn't exist
      if (userError && userError.code === 'PGRST116') {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            phone_number: phoneNumber,
            is_verified: true
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          res.status(500).json({
            success: false,
            error: 'Failed to create user'
          });
          return;
        }

        user = newUser;
      } else if (userError) {
        console.error('Error fetching user:', userError);
        res.status(500).json({
          success: false,
          error: 'Database error'
        });
        return;
      } else {
        // Update existing user as verified
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ is_verified: true })
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating user:', updateError);
        } else {
          user = updatedUser;
        }
      }

      // Generate access token
      const accessToken = generateAccessToken(user.id);

      const response: ApiResponse<{ user: User; accessToken: string }> = {
        success: true,
        data: {
          user,
          accessToken
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Verify code error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const registerWithUsername = [
  // Validation
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]{3,30}$/)
    .withMessage('Username must be 3-30 characters, letters, numbers, and underscores only'),
  body('name')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Name is required and must be between 1 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),

  async (req: Request, res: Response): Promise<void> => {
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

      const { username, name, email } = req.body;

      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'Username is already taken'
        });
        return;
      }

      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          username,
          name,
          email,
          is_verified: true
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        res.status(500).json({
          success: false,
          error: 'Failed to create user'
        });
        return;
      }

      // Generate access token
      const accessToken = generateAccessToken(newUser.id);

      res.json({
        success: true,
        data: {
          user: newUser,
          accessToken
        },
        message: 'Account created successfully'
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const loginWithUsername = [
  // Validation
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]{3,30}$/)
    .withMessage('Invalid username format'),

  async (req: Request, res: Response): Promise<void> => {
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

      const { username } = req.body;

      // Find user by username
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (userError || !user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      // Generate access token
      const accessToken = generateAccessToken(user.id);

      res.json({
        success: true,
        data: {
          user,
          accessToken
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const updateProfile = [
  // Validation
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Name must be between 1 and 100 characters'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]{3,30}$/)
    .withMessage('Username must be 3-30 characters, letters, numbers, and underscores only'),
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('Avatar URL must be a valid URL'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),

  async (req: Request, res: Response): Promise<void> => {
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

      const userId = (req as any).user.id;
      const { name, username, avatarUrl, email } = req.body;

      // If updating username, check if it's available
      if (username) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .neq('id', userId)
          .single();

        if (existingUser) {
          res.status(400).json({
            success: false,
            error: 'Username is already taken'
          });
          return;
        }
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (username !== undefined) updateData.username = username;
      if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
      if (email !== undefined) updateData.email = email;

      const { data: user, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update profile'
        });
        return;
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
];

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};