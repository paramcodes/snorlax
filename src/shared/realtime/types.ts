import { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

export type RealtimeStatus = `${REALTIME_SUBSCRIBE_STATES}`;

export interface BroadcastEventPayload<T = Record<string, unknown>> {
  type: 'broadcast';
  event: string;
  payload: T;
}

export interface PresenceState {
  [key: string]: Array<{
    presence_ref: string;
    user_id: string;
    online_at: string;
    [key: string]: unknown;
  }>;
}

export interface ChannelSubscriptionOptions {
  channelId: string;
  workspaceId?: string;
  user?: {
    id: string;
    displayName?: string;
    [key: string]: unknown;
  };
  onBroadcast?: (event: string, payload: unknown) => void;
  onPresenceSync?: (presenceState: PresenceState) => void;
  onPresenceJoin?: (key: string, currentPresence: unknown, newPresence: unknown) => void;
  onPresenceLeave?: (key: string, currentPresence: unknown, leftPresence: unknown) => void;
  onStatusChange?: (status: RealtimeStatus, err?: Error) => void;
}

export interface RealtimeSubscriptionHandle {
  channel: RealtimeChannel;
  sendBroadcast: <T>(event: string, payload: T) => Promise<'ok' | 'timed out' | 'error'>;
  trackPresence: <T extends Record<string, unknown>>(payload: T) => Promise<'ok' | 'timed out' | 'error'>;
  unsubscribe: () => Promise<void>;
}
