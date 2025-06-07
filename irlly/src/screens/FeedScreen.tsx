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
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  feedItem: {
    padding: 16,
    margin: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  itemTime: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  itemNote: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  itemLocation: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCreator: {
    fontSize: 12,
    color: '#6c757d',
  },
  itemAttendees: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  rsvpButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  rsvpButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rsvpButtonGoing: {
    backgroundColor: '#007AFF',
  },
  rsvpButtonNotGoing: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  rsvpButtonTextGoing: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rsvpButtonTextNotGoing: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  rsvpStatus: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    alignItems: 'center',
  },
  rsvpStatusText: {
    fontSize: 14,
    color: '#2d5a2d',
    fontWeight: '500',
  },
});
