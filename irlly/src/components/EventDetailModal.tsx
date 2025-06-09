import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { FeedItem, ScheduledMeetup } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

interface EventDetailModalProps {
  visible: boolean;
  onClose: () => void;
  item: FeedItem | null;
  onCancelEvent?: (eventId: string, eventType: 'pin' | 'scheduled') => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  visible,
  onClose,
  item,
  onCancelEvent,
}) => {
  const { user } = useAuth();

  if (!item) return null;

  const isCreator = user?.id === item.creator.id;
  const isPin = item.type === 'pin';

  const formatTime = () => {
    if (isPin) {
      return 'Happening now';
    } else {
      const scheduledFor = new Date((item.data as ScheduledMeetup).scheduledFor);
      return scheduledFor.toLocaleString();
    }
  };

  const openInMaps = () => {
    const { latitude, longitude, address } = item.data;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const handleCancelEvent = () => {
    Alert.alert(
      'Cancel Event',
      'Are you sure you want to cancel this event? This cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              let response;
              if (item.type === 'pin') {
                response = await apiService.cancelPin(item.data.id);
              } else {
                response = await apiService.cancelMeetup(item.data.id);
              }

              if (response.success) {
                Alert.alert('Success', 'Event cancelled successfully');
                if (onCancelEvent) {
                  onCancelEvent(item.data.id, item.type);
                }
                onClose();
              } else {
                Alert.alert('Error', response.error || 'Failed to cancel event');
              }
            } catch (error) {
              logger.error('Error cancelling event:', error);
              Alert.alert('Error', 'Network error occurred');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Event Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Event Info */}
          <View style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventTitle}>
                {item.data.emoji} {item.data.title}
              </Text>
              <Text style={styles.eventTime}>{formatTime()}</Text>
            </View>

            {'note' in item.data && item.data.note && (
              <Text style={styles.eventNote}>{item.data.note}</Text>
            )}

            {'description' in item.data && item.data.description && (
              <Text style={styles.eventNote}>{item.data.description}</Text>
            )}

            <TouchableOpacity onPress={openInMaps} style={styles.locationContainer}>
              <Text style={styles.locationText}>📍 {item.data.address}</Text>
              <Text style={styles.locationSubtext}>Tap to open in Maps</Text>
            </TouchableOpacity>

            <Text style={styles.creatorText}>Created by {item.creator.name}</Text>
          </View>

          {/* RSVP Status */}
          {item.rsvpStatus && (
            <View style={styles.rsvpCard}>
              <Text style={styles.rsvpTitle}>Your RSVP</Text>
              <Text style={[
                styles.rsvpStatus,
                item.rsvpStatus === 'attending' ? styles.rsvpGoing : styles.rsvpNotGoing
              ]}>
                {item.rsvpStatus === 'attending' ? '✓ Going' : '✗ Not Going'}
              </Text>
            </View>
          )}

          {/* Attendees */}
          <View style={styles.attendeesCard}>
            <Text style={styles.attendeesTitle}>
              Who's Going ({item.attendeeCount})
            </Text>
            {item.attendees.length > 0 ? (
              <View style={styles.attendeesList}>
                {item.attendees.map((attendee, index) => (
                  <View key={attendee.id} style={styles.attendeeItem}>
                    <View style={styles.attendeeAvatar}>
                      <Text style={styles.attendeeInitial}>
                        {(attendee.name || attendee.username || '?')[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.attendeeName}>
                      {attendee.name || attendee.username || 'Unknown'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noAttendeesText}>No one is going yet</Text>
            )}
          </View>

          {/* Creator Actions */}
          {isCreator && (
            <View style={styles.creatorActions}>
              <Text style={styles.creatorActionsTitle}>Event Management</Text>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEvent}
              >
                <Text style={styles.cancelButtonText}>Cancel Event</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventHeader: {
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  eventTime: {
    fontSize: 16,
    color: '#ED8936',
    fontWeight: '600',
  },
  eventNote: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 16,
    lineHeight: 22,
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationText: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
  },
  locationSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  creatorText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  rsvpCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rsvpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  rsvpStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  rsvpGoing: {
    color: '#10B981',
  },
  rsvpNotGoing: {
    color: '#EF4444',
  },
  attendeesCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attendeesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  attendeesList: {
    gap: 12,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attendeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ED8936',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendeeInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  attendeeName: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
  },
  noAttendeesText: {
    fontSize: 16,
    color: '#64748B',
    fontStyle: 'italic',
  },
  creatorActions: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  creatorActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
});