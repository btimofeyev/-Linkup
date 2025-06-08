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

export const FeedScreen: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const { feedItems, loadFeed, refreshFeed } = useFeed();

  const loadNotifications = async () => {
    try {
      const response = await apiService.getNotifications();
      if (response.success && response.data) {
        const notificationData = response.data.notifications.map((notif: any) => ({
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
        }));
        setNotifications(notificationData);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadFeed();
        loadNotifications();
      }
    }, [user, loadFeed])
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
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
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

  const handleAddBack = async (notification: Notification) => {
    if (!notification.fromUser) return;
    
    try {
      const response = await apiService.addContactByUsername(notification.fromUser.username);
      if (response.success) {
        Alert.alert('Success', `Added @${notification.fromUser.username} back to your contacts!`);
        // Mark notification as read
        await apiService.markNotificationAsRead(notification.id);
        // Reload notifications
        await loadNotifications();
      } else {
        Alert.alert('Error', response.error || 'Failed to add contact');
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
      console.error('Error marking notification as read:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        },
      ]
    );
  };

  const renderFeedItem = ({ item }: { item: FeedItem }) => (
    <View style={styles.feedItem}>
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
          {item.attendee_count} attending
        </Text>
      </View>
      
      {item.rsvp_status ? (
        <View style={styles.rsvpStatus}>
          <Text style={styles.rsvpStatusText}>
            You're {item.rsvp_status === 'attending' ? 'going' : 'not going'}
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
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Linkup</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
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
                          <TouchableOpacity
                            style={styles.addBackButton}
                            onPress={() => handleAddBack(notification)}
                          >
                            <Text style={styles.addBackButtonText}>Add Back</Text>
                          </TouchableOpacity>
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
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
