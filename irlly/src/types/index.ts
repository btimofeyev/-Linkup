export interface User {
  id: string;
  username?: string;
  phoneNumber?: string;
  name?: string;
  email?: string;
  avatar?: string;
  createdAt: Date;
}

export interface Contact {
  id: string;
  userId: string;
  contactId: string;
  name: string;
  username?: string;
  phoneNumber?: string;
  email?: string;
  isRegistered: boolean;
  createdAt: Date;
}

export interface UserSearchResult {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
}

export interface Circle {
  id: string;
  userId: string;
  name: string;
  emoji?: string;
  contactIds: string[];
  createdAt: Date;
}

export interface Pin {
  id: string;
  userId: string;
  title: string;
  note?: string;
  emoji?: string;
  latitude: number;
  longitude: number;
  address?: string;
  circleIds: string[];
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface ScheduledMeetup {
  id: string;
  userId: string;
  title: string;
  description?: string;
  emoji?: string;
  latitude: number;
  longitude: number;
  address?: string;
  scheduledFor: Date;
  circleIds: string[];
  createdAt: Date;
}

export interface RSVP {
  id: string;
  userId: string;
  meetupId: string;
  meetupType: 'pin' | 'scheduled';
  response: 'attending' | 'not_attending';
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  fromUserId?: string;
  type: 'friend_request' | 'friend_accepted' | 'meetup_invite' | 'rsvp_update';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
  fromUser?: {
    id: string;
    username: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface FeedItem {
  id: string;
  type: 'pin' | 'scheduled';
  data: Pin | ScheduledMeetup;
  creator: User;
  rsvpStatus?: 'attending' | 'not_attending';
  attendeeCount: number;
}