import { create } from 'zustand';
import { User, Workspace, Channel, Message, Reaction, Attachment } from '../types';
import { supabase } from '../shared/supabase/client';

interface AppState {
  currentUser: User | null;
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  channels: Channel[];
  currentChannelId: string | null;
  messages: Message[];
  currentThreadMessageId: string | null;
  isSearchOpen: boolean;
  isCreateChannelOpen: boolean;
  isInviteOpen: boolean;
  isLoading: boolean;
  hasError: boolean;
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  setWorkspace: (workspaceId: string) => void;
  setChannel: (channelId: string) => void;
  setCurrentThread: (messageId: string | null) => void;
  setSearchOpen: (open: boolean) => void;
  setCreateChannelOpen: (open: boolean) => void;
  setInviteOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: boolean) => void;
  
  createWorkspace: (name: string) => Promise<void>;
  createChannel: (name: string, topic: string, isPrivate: boolean) => Promise<void>;
  sendMessage: (content: string, attachments?: Attachment[], parentId?: string) => Promise<void>;
  retrySendMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  loginDemo: (userType: 'alex' | 'jordan') => void;
  logout: () => void;
}

const DEFAULT_USERS: Record<'alex' | 'jordan', User> = {
  alex: {
    id: 'user-alex',
    email: 'alex@snorlax.dev',
    displayName: 'Alex Rivers',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    status: 'Engineering Lead',
  },
  jordan: {
    id: 'user-jordan',
    email: 'jordan@snorlax.dev',
    displayName: 'Jordan Lee',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    status: 'Senior Product Designer',
  },
};

const INITIAL_WORKSPACES: Workspace[] = [
  { id: 'ws-1', name: 'Acme Engineering', slug: 'acme-eng', ownerId: 'user-alex' },
  { id: 'ws-2', name: 'Design & Product', slug: 'design-prod', ownerId: 'user-jordan' },
];

const INITIAL_CHANNELS: Channel[] = [
  { id: 'chan-general', workspaceId: 'ws-1', name: 'general', topic: 'Company-wide announcements and work matters', isPrivate: false, unreadCount: 2, mentionCount: 1 },
  { id: 'chan-frontend', workspaceId: 'ws-1', name: 'frontend-guild', topic: 'React, Vite, TypeScript & UI architecture', isPrivate: false, unreadCount: 0, mentionCount: 0 },
  { id: 'chan-leadership', workspaceId: 'ws-1', name: 'leadership', topic: 'Private channel for strategic syncs', isPrivate: true, unreadCount: 1, mentionCount: 0 },
  { id: 'chan-design-general', workspaceId: 'ws-2', name: 'general', topic: 'Design team hub', isPrivate: false, unreadCount: 0, mentionCount: 0 },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    channelId: 'chan-general',
    userId: 'user-alex',
    userName: 'Alex Rivers',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    content: 'Welcome everyone to Snorlax! 🚀 Our secure team collaboration workspace is fully online.',
    reactions: [{ id: 'react-1', messageId: 'msg-1', userId: 'user-jordan', emoji: '🎉' }],
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    status: 'sent',
  },
  {
    id: 'msg-2',
    channelId: 'chan-general',
    userId: 'user-jordan',
    userName: 'Jordan Lee',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    content: 'Awesome! Loving the Duolingo green theme and fast browser experience. @alex let us ship the MVP!',
    reactions: [{ id: 'react-2', messageId: 'msg-2', userId: 'user-alex', emoji: '💯' }],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'sent',
  },
  {
    id: 'msg-3',
    channelId: 'chan-general',
    userId: 'user-alex',
    userName: 'Alex Rivers',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    content: 'Thread reply test here! Check out the replies below.',
    reactions: [],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'sent',
  },
  {
    id: 'msg-thread-1',
    channelId: 'chan-general',
    userId: 'user-jordan',
    userName: 'Jordan Lee',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    content: 'Replying in thread: everything looks super smooth.',
    parentId: 'msg-3',
    reactions: [{ id: 'react-3', messageId: 'msg-thread-1', userId: 'user-alex', emoji: '👍' }],
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    status: 'sent',
  },
  {
    id: 'msg-4',
    channelId: 'chan-frontend',
    userId: 'user-jordan',
    userName: 'Jordan Lee',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    content: 'Tailwind v4 tokens are configured and verified with agent-browser.',
    reactions: [{ id: 'react-4', messageId: 'msg-4', userId: 'user-alex', emoji: '🚀' }],
    createdAt: new Date(Date.now() - 900000).toISOString(),
    status: 'sent',
  }
];

export const useStore = create<AppState>((set, get) => ({
  currentUser: DEFAULT_USERS.alex,
  workspaces: INITIAL_WORKSPACES,
  currentWorkspaceId: 'ws-1',
  channels: INITIAL_CHANNELS,
  currentChannelId: 'chan-general',
  messages: INITIAL_MESSAGES,
  currentThreadMessageId: null,
  isSearchOpen: false,
  isCreateChannelOpen: false,
  isInviteOpen: false,
  isLoading: false,
  hasError: false,

  setCurrentUser: (user) => set({ currentUser: user }),
  setWorkspace: (workspaceId) => {
    const firstChan = get().channels.find(c => c.workspaceId === workspaceId);
    set({ currentWorkspaceId: workspaceId, currentChannelId: firstChan ? firstChan.id : null, currentThreadMessageId: null });
  },
  setChannel: (channelId) => {
    set(state => ({
      currentChannelId: channelId,
      currentThreadMessageId: null,
      channels: state.channels.map(c => c.id === channelId ? { ...c, unreadCount: 0, mentionCount: 0 } : c)
    }));
  },
  setCurrentThread: (messageId) => set({ currentThreadMessageId: messageId }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setCreateChannelOpen: (open) => set({ isCreateChannelOpen: open }),
  setInviteOpen: (open) => set({ isInviteOpen: open }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ hasError: error }),

  createWorkspace: async (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newWs: Workspace = { id: `ws-${Date.now()}`, name, slug, ownerId: get().currentUser?.id || 'user-alex' };
    const newChan: Channel = { id: `chan-${Date.now()}`, workspaceId: newWs.id, name: 'general', topic: 'Default workspace channel', isPrivate: false, unreadCount: 0, mentionCount: 0 };
    set(state => ({
      workspaces: [...state.workspaces, newWs],
      channels: [...state.channels, newChan],
      currentWorkspaceId: newWs.id,
      currentChannelId: newChan.id
    }));
  },

  createChannel: async (name, topic, isPrivate) => {
    const wsId = get().currentWorkspaceId;
    if (!wsId) return;
    const cleanName = name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const newChan: Channel = { id: `chan-${Date.now()}`, workspaceId: wsId, name: cleanName, topic, isPrivate, unreadCount: 0, mentionCount: 0 };
    set(state => ({
      channels: [...state.channels, newChan],
      currentChannelId: newChan.id,
      isCreateChannelOpen: false
    }));
  },

  sendMessage: async (content, attachments = [], parentId) => {
    const user = get().currentUser;
    const chanId = get().currentChannelId;
    if (!user || !chanId || (!content.trim() && attachments.length === 0)) return;

    const messageId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const optimisticMsg: Message = {
      id: messageId,
      channelId: chanId,
      userId: user.id,
      userName: user.displayName,
      userAvatar: user.avatarUrl,
      content,
      parentId,
      attachments,
      reactions: [],
      createdAt,
      status: 'sending',
    };

    // Optimistic insert
    set(state => ({ messages: [...state.messages, optimisticMsg] }));

    try {
      // 1. Insert message into DB
      const { error: insertError } = await supabase.from('messages').insert({
        id: messageId,
        channel_id: chanId,
        user_id: user.id,
        content,
        parent_id: parentId || null,
      });

      if (insertError) throw insertError;

      // 2. Insert attachments if any
      if (attachments.length > 0) {
        const attachmentRows = attachments.map(att => ({
          id: att.id,
          message_id: messageId,
          file_path: att.url, // Stored path/url
          file_name: att.fileName,
          file_size: att.fileSize,
          content_type: att.contentType,
        }));

        const { error: attError } = await supabase.from('attachments').insert(attachmentRows);
        if (attError) {
          console.error('Failed to insert attachment records:', attError);
        }
      }

      // Mark as sent
      set(state => ({
        messages: state.messages.map(m => m.id === messageId ? { ...m, status: 'sent' } : m)
      }));
    } catch (err) {
      console.error('Failed to send message:', err);
      set(state => ({
        messages: state.messages.map(m => m.id === messageId ? { ...m, status: 'failed' } : m)
      }));
    }
  },

  retrySendMessage: async (messageId) => {
    const msg = get().messages.find(m => m.id === messageId);
    if (!msg || msg.status !== 'failed') return;

    set(state => ({
      messages: state.messages.map(m => m.id === messageId ? { ...m, status: 'sending' } : m)
    }));

    try {
      const { error: insertError } = await supabase.from('messages').insert({
        id: messageId,
        channel_id: msg.channelId,
        user_id: msg.userId,
        content: msg.content,
        parent_id: msg.parentId || null,
      });

      if (insertError) throw insertError;

      set(state => ({
        messages: state.messages.map(m => m.id === messageId ? { ...m, status: 'sent' } : m)
      }));
    } catch (err) {
      console.error('Retry send failed:', err);
      set(state => ({
        messages: state.messages.map(m => m.id === messageId ? { ...m, status: 'failed' } : m)
      }));
    }
  },

  editMessage: async (messageId, newContent) => {
    const editedAt = new Date().toISOString();
    // Optimistic update
    set(state => ({
      messages: state.messages.map(m => m.id === messageId ? { ...m, content: newContent, editedAt, updatedAt: editedAt } : m)
    }));

    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: newContent, edited_at: editedAt, updated_at: editedAt })
        .eq('id', messageId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update message in DB:', err);
    }
  },

  deleteMessage: async (messageId) => {
    const state = get();
    const hasChildReplies = state.messages.some(m => m.parentId === messageId);

    if (hasChildReplies) {
      // Hybrid soft delete: parent has thread replies, keep row as tombstone
      const deletedAt = new Date().toISOString();
      set(state => ({
        messages: state.messages.map(m => m.id === messageId ? { ...m, content: '', deletedAt, updatedAt: deletedAt, attachments: [] } : m)
      }));

      try {
        await supabase
          .from('messages')
          .update({ deleted_at: deletedAt, content: '', updated_at: deletedAt })
          .eq('id', messageId);
      } catch (err) {
        console.error('Failed to soft delete message in DB:', err);
      }
    } else {
      // Hard delete if zero thread replies
      set(state => ({
        messages: state.messages.filter(m => m.id !== messageId)
      }));

      try {
        await supabase.from('messages').delete().eq('id', messageId);
      } catch (err) {
        console.error('Failed to hard delete message in DB:', err);
      }
    }
  },

  toggleReaction: async (messageId, emoji) => {
    const user = get().currentUser;
    if (!user) return;

    const message = get().messages.find(m => m.id === messageId);
    if (!message) return;

    const existing = message.reactions.find(r => r.userId === user.id && r.emoji === emoji);

    // Optimistic update
    let updatedReactions;
    if (existing) {
      updatedReactions = message.reactions.filter(r => !(r.userId === user.id && r.emoji === emoji));
    } else {
      updatedReactions = [...message.reactions, { id: `react-${Date.now()}`, messageId, userId: user.id, emoji }];
    }

    set(state => ({
      messages: state.messages.map(msg => msg.id === messageId ? { ...msg, reactions: updatedReactions } : msg)
    }));

    try {
      if (existing) {
        await supabase
          .from('reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('emoji', emoji);
      } else {
        await supabase
          .from('reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
          });
      }
    } catch (err) {
      console.error('Failed to persist reaction toggle:', err);
      // Rollback on failure
      set(state => ({
        messages: state.messages.map(msg => msg.id === messageId ? { ...msg, reactions: message.reactions } : msg)
      }));
    }
  },

  loginDemo: (userType) => {
    set({ currentUser: DEFAULT_USERS[userType] });
  },

  logout: () => {
    set({ currentUser: null });
  }
}));
