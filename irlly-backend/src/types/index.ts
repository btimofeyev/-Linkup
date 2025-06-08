export interface User {
  id: string;
  phone_number: string;
  name?: string;
  avatar_url?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  contact_user_id?: string;
  name: string;
  phone_number: string;
  is_registered: boolean;
  created_at: string;
  updated_at: string;
}

export interface Circle {
  id: string;
  user_id: string;
  name: string;
  emoji?: string;
  created_at: string;
  updated_at: string;
  members?: Contact[];
}

export interface Pin {
  id: string;
  user_id: string;
  title: string;
  note?: string;
  emoji?: string;
  latitude: number;
  longitude: number;
  address?: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
  circles?: string[];
}

export interface ScheduledMeetup {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  emoji?: string;
  latitude: number;
  longitude: number;
  address?: string;
  scheduled_for: string;
  created_at: string;
  updated_at: string;
  circles?: string[];
}

export interface RSVP {
  id: string;
  user_id: string;
  meetup_id: string;
  meetup_type: 'pin' | 'scheduled';
  response: 'attending' | 'not_attending';
  created_at: string;
  updated_at: string;
}

export interface VerificationCode {
  id: string;
  phone_number: string;
  code: string;
  expires_at: string;
  is_used: boolean;
  created_at: string;
}

export interface FeedItem {
  id: string;
  type: 'pin' | 'scheduled';
  data: Pin | ScheduledMeetup;
  creator: User;
  rsvp_status?: 'attending' | 'not_attending';
  attendee_count: number;
  attendees: {
    id: string;
    name?: string;
    username?: string;
    avatar_url?: string;
  }[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthRequest extends Request {
  user?: User;
}