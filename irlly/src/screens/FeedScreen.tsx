import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FeedItem, ScheduledMeetup } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

export const FeedScreen: React.FC = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();

  useFocusEffect(
    React.useCallback(() => {
      loadFeed();
    }, [user])
  );

  const loadFeed = async () => {
    if (!user) return;
    
    try {
      const response = await apiService.getFeed();
      if (response.success && response.data) {
        setFeedItems(response.data.feed || []);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFeed();
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
        await loadFeed();
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>IRLly</Text>
      </View>
      
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Modern light background
  },
  header: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700', // Bold
    color: '#0F172A', // Modern dark slate
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
    color: '#0F172A',
    flex: 1,
    marginRight: 12,
    lineHeight: 26,
  },
  itemTime: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    backgroundColor: '#8B5CF6', // Modern purple
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
    color: '#8B5CF6',
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
    color: '#0F172A',
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
});
