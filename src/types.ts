export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  status?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
}

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  topic?: string;
  isPrivate: boolean;
  unreadCount?: number;
  mentionCount?: number;
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  url: string;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  parentId?: string;
  attachments?: Attachment[];
  reactions: Reaction[];
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  updatedAt?: string;
  status?: 'sending' | 'sent' | 'failed';
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
}
