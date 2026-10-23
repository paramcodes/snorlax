import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeService } from './realtimeService';
import { ChannelSubscriptionOptions, RealtimeStatus, PresenceState, RealtimeSubscriptionHandle } from './types';

export interface UseRealtimeChannelProps extends Omit<ChannelSubscriptionOptions, 'onStatusChange'> {
  enabled?: boolean;
}

export function useRealtimeChannel({
  channelId,
  workspaceId,
  user,
  enabled = true,
  onBroadcast,
  onPresenceSync,
  onPresenceJoin,
  onPresenceLeave,
}: UseRealtimeChannelProps) {
  const [status, setStatus] = useState<RealtimeStatus>('CLOSED');
  const [error, setError] = useState<Error | null>(null);
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const handleRef = useRef<RealtimeSubscriptionHandle | null>(null);

  const handlePresenceSync = useCallback((state: PresenceState) => {
    setPresenceState(state);
    if (onPresenceSync) {
      onPresenceSync(state);
    }
  }, [onPresenceSync]);

  useEffect(() => {
    if (!enabled || !channelId) {
      return;
    }

    const subscription = RealtimeService.subscribeToChannel({
      channelId,
      workspaceId,
      user,
      onBroadcast,
      onPresenceSync: handlePresenceSync,
      onPresenceJoin,
      onPresenceLeave,
      onStatusChange: (newStatus, err) => {
        setStatus(newStatus);
        if (err) {
          setError(err);
        } else if (newStatus === 'SUBSCRIBED') {
          setError(null);
        }
      },
    });

    handleRef.current = subscription;

    return () => {
      if (handleRef.current) {
        handleRef.current.unsubscribe().catch((err) => {
          console.error('Error unsubscribing realtime channel on cleanup:', err);
        });
        handleRef.current = null;
      }
    };
  }, [channelId, workspaceId, user, enabled, onBroadcast, handlePresenceSync, onPresenceJoin, onPresenceLeave]);

  const sendBroadcast = useCallback(async <T>(event: string, payload: T) => {
    if (!handleRef.current) {
      throw new Error('Realtime channel is not subscribed');
    }
    return handleRef.current.sendBroadcast(event, payload);
  }, []);

  const trackPresence = useCallback(async <T extends Record<string, unknown>>(payload: T) => {
    if (!handleRef.current) {
      throw new Error('Realtime channel is not subscribed');
    }
    return handleRef.current.trackPresence(payload);
  }, []);

  return {
    status,
    error,
    presenceState,
    sendBroadcast,
    trackPresence,
  };
}
