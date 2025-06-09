import { supabase } from './supabaseClient';

export class AuthService {
  // Send magic link via email
  async sendEmailMagicLink(email: string) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Magic link sent to your email' };
    } catch (error) {
      return { success: false, error: 'Failed to send magic link' };
    }
  }

  // Verify OTP from email
  async verifyEmailOTP(email: string, token: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: 'email'
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        data: {
          user: data.user,
          session: data.session
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to verify OTP' };
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return { success: true, user };
    } catch (error) {
      return { success: false, error: 'Failed to get user' };
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to sign out' };
    }
  }

  // Listen for auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();