import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pin, ScheduledMeetup, FeedItem, User, RSVP } from '../types';

// Mock backend service for development
export class MockApiService {
  private static PINS_KEY = 'pins';
  private static MEETUPS_KEY = 'scheduled_meetups';
  private static RSVPS_KEY = 'rsvps';

  // Pin operations
  static async createPin(pinData: Omit<Pin, 'id' | 'createdAt'>): Promise<Pin> {
    const pin: Pin = {
      ...pinData,
      id: Date.now().toString(),
      createdAt: new Date(),
      isActive: true,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    };

    const existingPins = await this.getAllPins();
    const updatedPins = [...existingPins, pin];
    await AsyncStorage.setItem(this.PINS_KEY, JSON.stringify(updatedPins));
    
    return pin;
  }

  static async getAllPins(): Promise<Pin[]> {
    try {
      const pinsJson = await AsyncStorage.getItem(this.PINS_KEY);
      const pins = pinsJson ? JSON.parse(pinsJson) : [];
      
      // Filter out expired pins
      const activePins = pins.filter((pin: Pin) => {
        const expiresAt = new Date(pin.expiresAt);
        return expiresAt > new Date() && pin.isActive;
      });
      
      return activePins;
    } catch (error) {
      console.error('Error getting pins:', error);
      return [];
    }
  }

  // Scheduled meetup operations
  static async createScheduledMeetup(
    meetupData: Omit<ScheduledMeetup, 'id' | 'createdAt'>
  ): Promise<ScheduledMeetup> {
    const meetup: ScheduledMeetup = {
      ...meetupData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };

    const existingMeetups = await this.getAllScheduledMeetups();
    const updatedMeetups = [...existingMeetups, meetup];
    await AsyncStorage.setItem(this.MEETUPS_KEY, JSON.stringify(updatedMeetups));
    
    return meetup;
  }

  static async getAllScheduledMeetups(): Promise<ScheduledMeetup[]> {
    try {
      const meetupsJson = await AsyncStorage.getItem(this.MEETUPS_KEY);
      return meetupsJson ? JSON.parse(meetupsJson) : [];
    } catch (error) {
      console.error('Error getting scheduled meetups:', error);
      return [];
    }
  }

  // RSVP operations
  static async createRSVP(rsvpData: Omit<RSVP, 'id' | 'createdAt'>): Promise<RSVP> {
    const rsvp: RSVP = {
      ...rsvpData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };

    const existingRSVPs = await this.getAllRSVPs();
    
    // Remove any existing RSVP for the same user and meetup
    const filteredRSVPs = existingRSVPs.filter(
      (r: RSVP) => !(r.userId === rsvp.userId && r.meetupId === rsvp.meetupId && r.meetupType === rsvp.meetupType)
    );
    
    const updatedRSVPs = [...filteredRSVPs, rsvp];
    await AsyncStorage.setItem(this.RSVPS_KEY, JSON.stringify(updatedRSVPs));
    
    return rsvp;
  }

  static async getAllRSVPs(): Promise<RSVP[]> {
    try {
      const rsvpsJson = await AsyncStorage.getItem(this.RSVPS_KEY);
      return rsvpsJson ? JSON.parse(rsvpsJson) : [];
    } catch (error) {
      console.error('Error getting RSVPs:', error);
      return [];
    }
  }

  static async getRSVPsForMeetup(meetupId: string, meetupType: 'pin' | 'scheduled'): Promise<RSVP[]> {
    const allRSVPs = await this.getAllRSVPs();
    return allRSVPs.filter(rsvp => rsvp.meetupId === meetupId && rsvp.meetupType === meetupType);
  }

  static async getUserRSVP(userId: string, meetupId: string, meetupType: 'pin' | 'scheduled'): Promise<RSVP | null> {
    const allRSVPs = await this.getAllRSVPs();
    const userRSVP = allRSVPs.find(
      rsvp => rsvp.userId === userId && rsvp.meetupId === meetupId && rsvp.meetupType === meetupType
    );
    return userRSVP || null;
  }

  // Feed operations
  static async getFeed(userId: string): Promise<FeedItem[]> {
    try {
      const [pins, scheduledMeetups, rsvps] = await Promise.all([
        this.getAllPins(),
        this.getAllScheduledMeetups(),
        this.getAllRSVPs(),
      ]);

      // Mock user data - in real app this would come from user service
      const mockUser: User = {
        id: userId,
        phoneNumber: '+1234567890',
        name: 'Current User',
        createdAt: new Date(),
      };

      const feedItems: FeedItem[] = [];

      // Add pins to feed
      for (const pin of pins) {
        const rsvpsForPin = rsvps.filter(
          rsvp => rsvp.meetupId === pin.id && rsvp.meetupType === 'pin'
        );
        const userRSVP = rsvpsForPin.find(rsvp => rsvp.userId === userId);
        const attendeeCount = rsvpsForPin.filter(rsvp => rsvp.response === 'attending').length;

        feedItems.push({
          id: `pin-${pin.id}`,
          type: 'pin',
          data: pin,
          creator: mockUser, // In real app, fetch actual creator
          rsvpStatus: userRSVP?.response,
          attendeeCount,
        });
      }

      // Add scheduled meetups to feed
      for (const meetup of scheduledMeetups) {
        const rsvpsForMeetup = rsvps.filter(
          rsvp => rsvp.meetupId === meetup.id && rsvp.meetupType === 'scheduled'
        );
        const userRSVP = rsvpsForMeetup.find(rsvp => rsvp.userId === userId);
        const attendeeCount = rsvpsForMeetup.filter(rsvp => rsvp.response === 'attending').length;

        feedItems.push({
          id: `meetup-${meetup.id}`,
          type: 'scheduled',
          data: meetup,
          creator: mockUser, // In real app, fetch actual creator
          rsvpStatus: userRSVP?.response,
          attendeeCount,
        });
      }

      // Sort by time proximity - pins (happening now) first, then by scheduled time
      feedItems.sort((a, b) => {
        if (a.type === 'pin' && b.type === 'scheduled') return -1;
        if (a.type === 'scheduled' && b.type === 'pin') return 1;
        
        if (a.type === 'scheduled' && b.type === 'scheduled') {
          const aTime = new Date((a.data as ScheduledMeetup).scheduledFor).getTime();
          const bTime = new Date((b.data as ScheduledMeetup).scheduledFor).getTime();
          return aTime - bTime;
        }
        
        return new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime();
      });

      return feedItems;
    } catch (error) {
      console.error('Error getting feed:', error);
      return [];
    }
  }

  // Utility methods
  static async clearAllData(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(this.PINS_KEY),
      AsyncStorage.removeItem(this.MEETUPS_KEY),
      AsyncStorage.removeItem(this.RSVPS_KEY),
    ]);
  }
}