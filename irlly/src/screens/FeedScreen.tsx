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
    backgroundColor: '#FAF9F6', // Soft Cream background
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600', // SemiBold
    color: '#2E2F45', // Charcoal Gray
    fontFamily: 'System', // Will be updated to Manrope/DM Sans
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  feedItem: {
    padding: 20,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: '600', // SemiBold
    color: '#2E2F45', // Charcoal Gray
    flex: 1,
    marginRight: 12,
    lineHeight: 26,
  },
  itemTime: {
    fontSize: 14,
    color: '#FF6B5A', // Warm Coral for time indicators
    fontWeight: '500', // Medium
    backgroundColor: '#FFF4A3', // Golden Yellow background
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemNote: {
    fontSize: 16,
    color: '#2E2F45',
    marginBottom: 12,
    lineHeight: 22,
    fontWeight: '400', // Regular
  },
  itemLocation: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '400',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemCreator: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  itemAttendees: {
    fontSize: 14,
    color: '#FF6B5A', // Warm Coral
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2E2F45',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
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
    minHeight: 48, // Minimum hit area
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rsvpButtonGoing: {
    backgroundColor: '#A4F1C5', // Mint Green
  },
  rsvpButtonNotGoing: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  rsvpButtonTextGoing: {
    color: '#065F46',
    fontSize: 16,
    fontWeight: '500',
  },
  rsvpButtonTextNotGoing: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  rsvpStatus: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#A4F1C5',
    borderRadius: 12,
    alignItems: 'center',
  },
  rsvpStatusText: {
    fontSize: 16,
    color: '#065F46',
    fontWeight: '500',
  },
});
