import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/database';
import { User } from '../types';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
      return;
    }

    // Verify Supabase JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
      return;
    }

    // Get user profile from our users table or create if doesn't exist
    let { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // User doesn't exist in our table, create them
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email?.split('@')[0] || '',
          username: user.user_metadata?.username || user.email?.split('@')[0] || '',
          phone_number: user.phone || null,
          avatar_url: user.user_metadata?.avatar_url
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to create user profile' 
        });
        return;
      }
      
      userProfile = newUser;
    } else if (profileError) {
      console.error('Error fetching user profile:', profileError);
      res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
      return;
    }

    req.user = userProfile;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
};

// No longer needed - Supabase handles token generation
// export const generateAccessToken = (userId: string): string => {
//   return jwt.sign({ userId }, process.env.JWT_SECRET!, { 
//     expiresIn: '7d' 
//   });
// };