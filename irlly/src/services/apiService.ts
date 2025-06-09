import { supabase } from './supabaseClient';

// API URLs for different environments
const API_BASE_URL = 'https://linkup-production-8095.up.railway.app/api';  // Production
//const API_BASE_URL = 'http://192.168.100.96:3000/api';  // Home PC (Development)
// const API_BASE_URL = 'http://192.168.1.32:3000/api';    // Laptop local (Development)

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Get Supabase auth token automatically
    const token = await this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  // Authentication now handled by Supabase Auth

  // Contacts
  async syncContacts(contacts: Array<{ name: string; phoneNumber: string }>) {
    return this.request('/contacts/sync', {
      method: 'POST',
      body: JSON.stringify({ contacts }),
    });
  }

  async getContacts() {
    return this.request('/contacts');
  }

  async getFriends() {
    return this.request('/contacts/friends');
  }

  async searchUsers(searchTerm: string) {
    return this.request(`/contacts/search?q=${encodeURIComponent(searchTerm)}`);
  }

  async sendFriendRequest(username: string) {
    return this.request('/contacts/friend-request', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  async getFriendRequests() {
    return this.request('/contacts/friend-requests');
  }

  async respondToFriendRequest(requestId: string, action: 'accept' | 'reject') {
    return this.request('/contacts/friend-request/respond', {
      method: 'POST',
      body: JSON.stringify({ requestId, action }),
    });
  }

  // Circles
  async createCircle(data: { name: string; emoji?: string; contactIds?: string[] }) {
    return this.request('/circles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCircles() {
    return this.request('/circles');
  }

  async updateCircle(circleId: string, data: { name?: string; emoji?: string }) {
    return this.request(`/circles/${circleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCircle(circleId: string) {
    return this.request(`/circles/${circleId}`, {
      method: 'DELETE',
    });
  }

  async addContactsToCircle(circleId: string, contactIds: string[]) {
    return this.request(`/circles/${circleId}/contacts`, {
      method: 'POST',
      body: JSON.stringify({ contactIds }),
    });
  }

  async removeContactFromCircle(circleId: string, contactId: string) {
    return this.request(`/circles/${circleId}/contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  // Pins
  async createPin(data: {
    title: string;
    note?: string;
    emoji?: string;
    latitude: number;
    longitude: number;
    address?: string;
    circleIds: string[];
  }) {
    return this.request('/pins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPins() {
    return this.request('/pins');
  }

  // Scheduled Meetups
  async createMeetup(data: {
    title: string;
    description?: string;
    emoji?: string;
    latitude: number;
    longitude: number;
    address?: string;
    scheduledFor: string;
    circleIds: string[];
  }) {
    return this.request('/meetups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMeetups() {
    return this.request('/meetups');
  }

  async cancelPin(pinId: string) {
    return this.request(`/pins/${pinId}`, {
      method: 'DELETE',
    });
  }

  async cancelMeetup(meetupId: string) {
    return this.request(`/meetups/${meetupId}`, {
      method: 'DELETE',
    });
  }

  // RSVPs
  async createRSVP(data: {
    meetupId: string;
    meetupType: 'pin' | 'scheduled';
    response: 'attending' | 'not_attending';
  }) {
    return this.request('/rsvp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Feed
  async getFeed() {
    return this.request('/feed');
  }

  // Notifications
  async getNotifications() {
    return this.request('/notifications');
  }

  async getUnreadNotificationCount() {
    return this.request('/notifications/unread-count');
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }
}

export const apiService = new ApiService();