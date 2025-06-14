import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FeedItem, ScheduledMeetup, Notification } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useFeed } from '../contexts/FeedContext';
import { apiService } from '../services/apiService';
import { EventDetailModal } from '../components/EventDetailModal';
import { UserMenu } from '../components/UserMenu';
import { logger } from '../utils/logger';

export const FeedScreen: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FeedItem | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const { user } = useAuth();
  const { feedItems, loadFeed, refreshFeed } = useFeed();

  const loadNotifications = React.useCallback(async () => {
    if (isLoadingNotifications) return; // Prevent multiple calls
    
    try {
      setIsLoadingNotifications(true);
      const response = await apiService.getNotifications();
      logger.log('FeedScreen: Notifications response:', response);
      if (response.success && response.data && (response.data as any).notifications) {
        const notificationsArray = (response.data as any).notifications;
        const notificationData = Array.isArray(notificationsArray) ? notificationsArray.map((notif: any) => ({
          id: notif.id,
          userId: notif.user_id,
          fromUserId: notif.from_user_id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          data: notif.data,
          isRead: notif.is_read,
          createdAt: new Date(notif.created_at),
          fromUser: notif.from_user ? {
            id: notif.from_user.id,
            username: notif.from_user.username,
            name: notif.from_user.name,
            avatarUrl: notif.from_user.avatar_url,
          } : undefined,
        })) : [];
        logger.log('FeedScreen: Processed notifications:', notificationData);
        setNotifications(notificationData);
      } else {
        logger.log('FeedScreen: No notifications data in response');
        setNotifications([]);
      }
    } catch (error) {
      logger.error('Error loading notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []); // Empty dependencies to prevent re-creation

  // Load data immediately when component mounts
  useEffect(() => {
    if (user) {
      loadFeed();
      loadNotifications();
    }
  }, [user?.id, loadFeed, loadNotifications]);

  // Also load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadFeed();
        loadNotifications();
      }
    }, [user?.id, loadFeed, loadNotifications])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshFeed(), loadNotifications()]);
    setIsRefreshing(false);
  };

  const handleRSVP = async (item: FeedItem, response: 'attending' | 'not_attending') => {
    if (!user) return;
    
    try {
      const rsvpResponse = await apiService.createRSVP({
        meetupId: item.data.id,
        meetupType: item.type,
        response,
      });
      
      if (rsvpResponse.success) {
        // Refresh feed to show updated RSVP status
        await refreshFeed();
      } else {
        logger.error('RSVP failed:', rsvpResponse.error);
        Alert.alert('Error', rsvpResponse.error || 'Failed to update RSVP');
      }
    } catch (error) {
      logger.error('Error updating RSVP:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const formatTime = (item: FeedItem) => {
    if (item.type === 'pin') {
      return 'Now';
    } else {
      const scheduledFor = new Date((item.data as ScheduledMeetup).scheduledFor);
      const now = new Date();
      const diffMs = scheduledFor.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        return `${diffDays}d`;
      } else if (diffHours > 0) {
        return `${diffHours}h`;
      } else if (diffMins > 0) {
        return `${diffMins}m`;
      } else {
        return 'Soon';
      }
    }
  };

  const handleAcceptFriendRequest = async (notification: Notification) => {
    logger.log('🔔 Accepting friend request, notification data:', {
      id: notification.id,
      type: notification.type,
      data: notification.data,
      fromUser: notification.fromUser
    });
    
    const friendRequestId = notification.data?.friend_request_id;
    const fromUsername = typeof notification.fromUser === 'string' ? notification.fromUser : notification.fromUser?.username;
    
    if (!friendRequestId) {
      logger.log('🚨 Friend request ID not found in notification data');
      Alert.alert('Error', 'Friend request ID not found');
      return;
    }
    
    try {
      const response = await apiService.respondToFriendRequest(friendRequestId, 'accept');
      if (response.success) {
        Alert.alert('Success', `Friend request accepted! @${fromUsername} is now your friend.`);
        // Mark notification as read
        await apiService.markNotificationAsRead(notification.id);
        // Reload notifications
        await loadNotifications();
      } else {
        Alert.alert('Error', response.error || 'Failed to accept friend request');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const handleRejectFriendRequest = async (notification: Notification) => {
    const friendRequestId = notification.data?.friend_request_id;
    const fromUsername = typeof notification.fromUser === 'string' ? notification.fromUser : notification.fromUser?.username;
    
    if (!friendRequestId) {
      Alert.alert('Error', 'Friend request ID not found');
      return;
    }
    
    try {
      const response = await apiService.respondToFriendRequest(friendRequestId, 'reject');
      if (response.success) {
        Alert.alert('Friend request rejected', `Rejected friend request from @${fromUsername}`);
        // Mark notification as read
        await apiService.markNotificationAsRead(notification.id);
        // Reload notifications
        await loadNotifications();
      } else {
        Alert.alert('Error', response.error || 'Failed to reject friend request');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  };


  const handleEventPress = (item: FeedItem) => {
    setSelectedEvent(item);
    setShowEventDetail(true);
  };

  const handleCloseEventDetail = () => {
    setShowEventDetail(false);
    setSelectedEvent(null);
  };

  const handleCancelEvent = async (eventId: string, eventType: 'pin' | 'scheduled') => {
    try {
      // Refresh the feed to remove the cancelled event
      await refreshFeed();
    } catch (error) {
      logger.error('Error refreshing feed after cancellation:', error);
    }
  };

  const renderFeedItem = ({ item }: { item: FeedItem }) => (
    <TouchableOpacity 
      style={styles.feedItem}
      onPress={() => handleEventPress(item)}
      activeOpacity={0.9}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>
          {item.data.emoji} {item.data.title}
        </Text>
        <Text style={styles.itemTime}>
          {formatTime(item)}
        </Text>
      </View>
      
      {'note' in item.data && item.data.note && (
        <Text style={styles.itemNote}>{item.data.note}</Text>
      )}
      
      {'description' in item.data && item.data.description && (
        <Text style={styles.itemNote}>{item.data.description}</Text>
      )}
      
      <Text style={styles.itemLocation}>{item.data.address}</Text>
      
      <View style={styles.itemFooter}>
        <Text style={styles.itemCreator}>by {item.creator.name}</Text>
        <Text style={styles.itemAttendees}>
          {item.attendeeCount > 0 
            ? `${item.attendeeCount} attending`
            : 'No one attending yet'
          }
        </Text>
      </View>
      
      {item.rsvpStatus ? (
        <View style={styles.rsvpStatus}>
          <Text style={styles.rsvpStatusText}>
            You're {item.rsvpStatus === 'attending' ? 'going' : 'not going'}
          </Text>
        </View>
      ) : (
        <View style={styles.rsvpButtons}>
          <TouchableOpacity
            style={[styles.rsvpButton, styles.rsvpButtonGoing]}
            onPress={() => handleRSVP(item, 'attending')}
          >
            <Text style={styles.rsvpButtonTextGoing}>I'm In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rsvpButton, styles.rsvpButtonNotGoing]}
            onPress={() => handleRSVP(item, 'not_attending')}
          >
            <Text style={styles.rsvpButtonTextNotGoing}>Can't Make It</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Linkup</Text>
          <UserMenu />
        </View>

        {/* Notifications Section */}
        {notifications.filter(n => !n.isRead).length > 0 && (
          <View style={styles.notificationsSection}>
            <TouchableOpacity
              style={styles.notificationsHeader}
              onPress={() => setShowNotifications(!showNotifications)}
            >
              <Text style={styles.notificationsTitle}>
                🔔 {notifications.filter(n => !n.isRead).length} new notification{notifications.filter(n => !n.isRead).length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.notificationsToggle}>
                {showNotifications ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            
            {showNotifications && (
              <View style={styles.notificationsList}>
                {notifications
                  .filter(n => !n.isRead)
                  .slice(0, 3) // Show max 3 notifications
                  .map((notification) => (
                    <View key={notification.id} style={styles.notificationItem}>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        <Text style={styles.notificationMessage}>{notification.message}</Text>
                        <Text style={styles.notificationTime}>
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.notificationActions}>
                        {notification.type === 'friend_request' && notification.fromUser && (
                          <View style={styles.friendRequestActions}>
                            <TouchableOpacity
                              style={styles.acceptButton}
                              onPress={() => handleAcceptFriendRequest(notification)}
                            >
                              <Text style={styles.acceptButtonText}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.rejectButton}
                              onPress={() => handleRejectFriendRequest(notification)}
                            >
                              <Text style={styles.rejectButtonText}>Reject</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        <TouchableOpacity
                          style={styles.markReadButton}
                          onPress={() => handleMarkAsRead(notification.id)}
                        >
                          <Text style={styles.markReadButtonText}>✓</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}
        
        <FlatList
          data={feedItems}
          renderItem={renderFeedItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No plans yet</Text>
              <Text style={styles.emptySubtitle}>
                Drop a pin or schedule something to get started!
              </Text>
            </View>
          }
        />
      </View>

      <EventDetailModal
        visible={showEventDetail}
        onClose={handleCloseEventDetail}
        item={selectedEvent}
        onCancelEvent={handleCancelEvent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0', // Soft cream background
  },
  content: {
    flex: 1,
    paddingTop: 24, // More space below SafeAreaView
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
    paddingBottom: 12,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700', // Bold
    color: '#2D3748', // Dark charcoal
    fontFamily: 'System',
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  feedItem: {
    padding: 20,
    marginVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
    marginRight: 12,
    lineHeight: 26,
  },
  itemTime: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    backgroundColor: '#ED8936', // Warm orange
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  itemNote: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 22,
    fontWeight: '400',
  },
  itemLocation: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 16,
    fontWeight: '500',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemCreator: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  itemAttendees: {
    fontSize: 14,
    color: '#ED8936',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rsvpButton: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  rsvpButtonGoing: {
    backgroundColor: '#10B981', // Modern green
  },
  rsvpButtonNotGoing: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  rsvpButtonTextGoing: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rsvpButtonTextNotGoing: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  rsvpStatus: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  rsvpStatusText: {
    fontSize: 16,
    color: '#166534',
    fontWeight: '600',
  },
  notificationsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notificationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  notificationsToggle: {
    fontSize: 16,
    color: '#64748B',
  },
  notificationsList: {
    padding: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FEF7ED',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FDB366',
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#4A5568',
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 12,
    color: '#718096',
  },
  notificationActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  friendRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#48BB78',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#F56565',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addBackButton: {
    backgroundColor: '#FDB366',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addBackButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  markReadButton: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  markReadButtonText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
});
