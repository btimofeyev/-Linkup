import { Request, Response } from 'express';
import { supabase } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { FeedItem } from '../types';

export const getFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get circles where the user is a member
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
    const userCircleIds = [...new Set([...memberCircleIds, ...ownedCircleIds])];

    console.log(`👤 User ${userId} feed access:`, {
      userContactIds: userContactIds.length,
      memberCircleIds: memberCircleIds.length,
      ownedCircleIds: ownedCircleIds.length,
      totalUserCircleIds: userCircleIds.length,
      userCircleIds
    });

    // Get active pins
    const { data: pins, error: pinsError } = await supabase
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

    if (pinsError) {
      console.error('Error fetching pins:', pinsError);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch feed'
      });
      return;
    }

    // Get scheduled meetups
    const { data: meetups, error: meetupsError } = await supabase
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

    if (meetupsError) {
      console.error('Error fetching meetups:', meetupsError);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch feed'
      });
      return;
    }

    // Get user's RSVPs
    const { data: userRSVPs } = await supabase
      .from('rsvps')
      .select('*')
      .eq('user_id', userId);

    const rsvpMap = new Map();
    userRSVPs?.forEach(rsvp => {
      rsvpMap.set(`${rsvp.meetup_id}-${rsvp.meetup_type}`, rsvp.response);
    });

    // Filter and transform pins
    const feedItems: FeedItem[] = [];

    // Process pins
    const accessiblePins = pins?.filter(pin => {
      // User can see their own pins
      if (pin.user_id === userId) return true;

      // User can see pins shared with their circles
      const hasAccess = pin.pin_circles?.some((pc: any) => userCircleIds.includes(pc.circle_id));
      console.log(`📍 Pin ${pin.id} access check:`, {
        pinCircles: pin.pin_circles?.map((pc: any) => pc.circle_id),
        userCircleIds,
        hasAccess
      });
      return hasAccess;
    });

    console.log(`📍 Accessible pins: ${accessiblePins?.length || 0} out of ${pins?.length || 0}`);

    for (const pin of accessiblePins || []) {
      // Get RSVP count for this pin
      const { data: pinRSVPs } = await supabase
        .from('rsvps')
        .select('response')
        .eq('meetup_id', pin.id)
        .eq('meetup_type', 'pin');

      const attendeeCount = pinRSVPs?.filter(rsvp => rsvp.response === 'attending').length || 0;
      const userRSVPStatus = rsvpMap.get(`${pin.id}-pin`);

      feedItems.push({
        id: `pin-${pin.id}`,
        type: 'pin',
        data: {
          ...pin,
          circles: pin.pin_circles?.map((pc: any) => pc.circle_id) || []
        },
        creator: pin.creator,
        rsvp_status: userRSVPStatus,
        attendee_count: attendeeCount
      });
    }

    // Process scheduled meetups
    const accessibleMeetups = meetups?.filter(meetup => {
      // User can see their own meetups
      if (meetup.user_id === userId) return true;

      // User can see meetups shared with their circles
      const hasAccess = meetup.meetup_circles?.some((mc: any) => userCircleIds.includes(mc.circle_id));
      console.log(`📅 Meetup ${meetup.id} access check:`, {
        meetupCircles: meetup.meetup_circles?.map((mc: any) => mc.circle_id),
        userCircleIds,
        hasAccess
      });
      return hasAccess;
    });

    console.log(`📅 Accessible meetups: ${accessibleMeetups?.length || 0} out of ${meetups?.length || 0}`);

    for (const meetup of accessibleMeetups || []) {
      // Get RSVP count for this meetup
      const { data: meetupRSVPs } = await supabase
        .from('rsvps')
        .select('response')
        .eq('meetup_id', meetup.id)
        .eq('meetup_type', 'scheduled');

      const attendeeCount = meetupRSVPs?.filter(rsvp => rsvp.response === 'attending').length || 0;
      const userRSVPStatus = rsvpMap.get(`${meetup.id}-scheduled`);

      feedItems.push({
        id: `meetup-${meetup.id}`,
        type: 'scheduled',
        data: {
          ...meetup,
          circles: meetup.meetup_circles?.map((mc: any) => mc.circle_id) || []
        },
        creator: meetup.creator,
        rsvp_status: userRSVPStatus,
        attendee_count: attendeeCount
      });
    }

    // Sort feed items: pins first (happening now), then by scheduled time
    feedItems.sort((a, b) => {
      if (a.type === 'pin' && b.type === 'scheduled') return -1;
      if (a.type === 'scheduled' && b.type === 'pin') return 1;

      if (a.type === 'scheduled' && b.type === 'scheduled') {
        const aTime = new Date((a.data as any).scheduled_for).getTime();
        const bTime = new Date((b.data as any).scheduled_for).getTime();
        return aTime - bTime;
      }

      // Both are pins, sort by creation time (newest first)
      return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime();
    });

    console.log(`📰 Final feed: ${feedItems.length} items for user ${userId}`);

    res.json({
      success: true,
      data: { feed: feedItems }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};