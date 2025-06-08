// API URLs for different environments
 const API_BASE_URL = 'http://192.168.100.96:3000/api';  // Home PC
// const API_BASE_URL = 'http://192.168.1.32:3000/api';    // Laptop local
//const API_BASE_URL = 'https://vast-rooms-decide.loca.lt/api'; // Laptop tunneled

class ApiService {
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
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

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
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

  // Authentication
  async sendVerificationCode(phoneNumber: string) {
    return this.request('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async verifyCodeAndLogin(phoneNumber: string, code: string) {
    return this.request<{ user: any; accessToken: string }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, code }),
    });
  }

  async checkUsernameAvailability(username: string, phoneNumber: string) {
    return this.request('/auth/check-availability', {
      method: 'POST',
      body: JSON.stringify({ username, phoneNumber }),
    });
  }

  async sendVerificationForRegistration(data: { username: string; phoneNumber: string; name: string; email?: string }) {
    return this.request('/auth/register/send-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyAndCreateUser(data: { username: string; phoneNumber: string; code: string; name: string; email?: string }) {
    return this.request<{ user: any; accessToken: string }>('/auth/register/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendVerificationForLogin(username: string) {
    return this.request('/auth/login/send-code', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  async verifyAndLogin(username: string, code: string) {
    return this.request<{ user: any; accessToken: string }>('/auth/login/verify', {
      method: 'POST',
      body: JSON.stringify({ username, code }),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(data: { name?: string; username?: string; avatarUrl?: string; email?: string }) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

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

  async searchUsers(searchTerm: string) {
    return this.request(`/contacts/search?q=${encodeURIComponent(searchTerm)}`);
  }

  async addContactByUsername(username: string) {
    return this.request('/contacts/add', {
      method: 'POST',
      body: JSON.stringify({ username }),
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
}

export const apiService = new ApiService();