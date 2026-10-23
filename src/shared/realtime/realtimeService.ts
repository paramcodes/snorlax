import { supabase } from '../supabase/client';
import { ChannelSubscriptionOptions, RealtimeSubscriptionHandle, RealtimeStatus, PresenceState } from './types';

export class RealtimeService {
  /**
   * Subscribe to a Supabase Realtime channel for Broadcast, Presence, and Postgres Changes.
   * Enforces error handling, status tracking, delta sync reconciliation, and reconnection watermarking.
   */
  public static subscribeToChannel(options: ChannelSubscriptionOptions): RealtimeSubscriptionHandle {
    const {
      channelId,
      workspaceId,
      user,
      onBroadcast,
      onMessageChange,
      onReactionChange,
      onReconnect,
      onPresenceSync,
      onPresenceJoin,
      onPresenceLeave,
      onStatusChange,
    } = options;

    const topicName = workspaceId 
      ? `workspace:${workspaceId}:channel:${channelId}` 
      : `channel:${channelId}`;

    let lastSyncedAt = new Date().toISOString();

    const channel = supabase.channel(topicName, {
      config: {
        broadcast: { self: false },
        presence: { key: user?.id || crypto.randomUUID() },
      },
    });

    // Setup broadcast listener if provided
    if (onBroadcast) {
      channel.on('broadcast', { event: '*' }, (payload: { event: string; payload: unknown }) => {
        try {
          onBroadcast(payload.event, payload.payload);
        } catch (err) {
          console.error(`Error in broadcast handler for channel ${channelId}:`, err);
        }
      });
    }

    // Setup postgres_changes for messages
    if (onMessageChange) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          try {
            lastSyncedAt = new Date().toISOString();
            onMessageChange({
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              new: payload.new,
              old: payload.old,
            });
          } catch (err) {
            console.error(`Error in message change listener for channel ${channelId}:`, err);
          }
        }
      );
    }

    // Setup postgres_changes for reactions (via message relationship or table)
    if (onReactionChange) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
        },
        (payload) => {
          try {
            lastSyncedAt = new Date().toISOString();
            onReactionChange({
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              new: payload.new,
              old: payload.old,
            });
          } catch (err) {
            console.error(`Error in reaction change listener for channel ${channelId}:`, err);
          }
        }
      );
    }

    // Setup presence listeners if provided
    if (onPresenceSync || onPresenceJoin || onPresenceLeave) {
      channel.on('presence', { event: 'sync' }, () => {
        try {
          if (onPresenceSync) {
            const state = channel.presenceState();
            onPresenceSync(state as unknown as PresenceState);
          }
        } catch (err) {
          console.error(`Error in presence sync for channel ${channelId}:`, err);
        }
      });

      if (onPresenceJoin) {
        channel.on('presence', { event: 'join' }, ({ key, currentPresences, newPresences }: { key: string; currentPresences: unknown; newPresences: unknown }) => {
          try {
            onPresenceJoin(key, currentPresences, newPresences);
          } catch (err) {
            console.error(`Error in presence join for channel ${channelId}:`, err);
          }
        });
      }

      if (onPresenceLeave) {
        channel.on('presence', { event: 'leave' }, ({ key, currentPresences, leftPresences }: { key: string; currentPresences: unknown; leftPresences: unknown }) => {
          try {
            onPresenceLeave(key, currentPresences, leftPresences);
          } catch (err) {
            console.error(`Error in presence leave for channel ${channelId}:`, err);
          }
        });
      }
    }

    // Track previous status to detect Reconnecting -> Connected transitions
    let previousStatus: RealtimeStatus | null = null;

    // Subscribe with status callback & error handling
    channel.subscribe(async (status, err) => {
      const typedStatus = status as RealtimeStatus;
      
      if (previousStatus && (previousStatus === 'TIMED_OUT' || previousStatus === 'CLOSED' || previousStatus === 'CHANNEL_ERROR') && typedStatus === 'SUBSCRIBED') {
        // Reconnected! Trigger delta sync reconciliation
        if (onReconnect) {
          try {
            onReconnect(lastSyncedAt);
          } catch (reconnectErr) {
            console.error(`Error during delta sync reconciliation on reconnect for channel ${channelId}:`, reconnectErr);
          }
        }
      }

      previousStatus = typedStatus;

      if (onStatusChange) {
        onStatusChange(typedStatus, err ? new Error(err.message || String(err)) : undefined);
      }

      if (status === 'SUBSCRIBED') {
        lastSyncedAt = new Date().toISOString();
        if (user) {
          try {
            await channel.track({
              user_id: user.id,
              display_name: user.displayName || 'User',
              online_at: new Date().toISOString(),
            });
          } catch (trackErr) {
            console.error(`Failed to track presence on subscribe for channel ${channelId}:`, trackErr);
          }
        }
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Realtime channel error on ${topicName}:`, err);
      } else if (status === 'TIMED_OUT') {
        console.warn(`Realtime channel subscription timed out on ${topicName}`);
      }
    });

    return {
      channel,
      sendBroadcast: async <T>(event: string, payload: T) => {
        try {
          const response = await channel.send({
            type: 'broadcast',
            event,
            payload: payload as Record<string, unknown>,
          });
          return response as 'ok' | 'timed out' | 'error';
        } catch (err) {
          console.error(`Failed to send broadcast event ${event} on ${topicName}:`, err);
          throw err;
        }
      },
      trackPresence: async <T extends Record<string, unknown>>(payload: T) => {
        try {
          const response = await channel.track(payload);
          return response as 'ok' | 'timed out' | 'error';
        } catch (err) {
          console.error(`Failed to track presence on ${topicName}:`, err);
          throw err;
        }
      },
      unsubscribe: async () => {
        try {
          await supabase.removeChannel(channel);
        } catch (err) {
          console.error(`Failed to unsubscribe channel ${topicName}:`, err);
          throw err;
        }
      },
    };
  }
}
