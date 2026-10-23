import React from 'react';
import { useStore } from '../store/useStore';
import { Hash, Lock, Plus, Users, ChevronDown, Sparkles, UserCheck } from 'lucide-react';

export const ChannelSidebar: React.FC = () => {
  const { 
    workspaces, 
    currentWorkspaceId, 
    channels, 
    currentChannelId, 
    setChannel, 
    setCreateChannelOpen, 
    setInviteOpen,
    currentUser,
    loginDemo
  } = useStore();

  const currentWs = workspaces.find(w => w.id === currentWorkspaceId);
  const wsChannels = channels.filter(c => c.workspaceId === currentWorkspaceId);
  const publicChannels = wsChannels.filter(c => !c.isPrivate);
  const privateChannels = wsChannels.filter(c => c.isPrivate);

  return (
    <div className="w-64 bg-[#1a1d21] flex flex-col border-r border-[#222529] select-none shrink-0">
      {/* Workspace Header */}
      <div className="h-14 px-4 border-b border-[#222529] flex items-center justify-between cursor-pointer hover:bg-[#222529]/50 transition-colors">
        <div className="flex items-center gap-2 truncate">
          <h2 className="font-bold text-white truncate text-base">{currentWs?.name || 'Workspace'}</h2>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </div>
      </div>

      {/* Navigation section */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Public Channels */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span>Channels</span>
            <button
              onClick={() => setCreateChannelOpen(true)}
              className="p-1 hover:bg-white/10 rounded-md text-gray-300 hover:text-white transition-colors"
              title="Create Channel"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-0.5">
            {publicChannels.map(channel => {
              const active = channel.id === currentChannelId;
              const hasUnread = (channel.unreadCount || 0) > 0;
              const hasMention = (channel.mentionCount || 0) > 0;

              return (
                <button
                  key={channel.id}
                  onClick={() => setChannel(channel.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active 
                      ? 'bg-brand-600/20 text-brand-400 font-semibold' 
                      : hasUnread 
                      ? 'text-white font-bold bg-white/5' 
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Hash className="w-4 h-4 text-brand-500 shrink-0" />
                    <span className="truncate">{channel.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasMention && (
                      <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                        {channel.mentionCount}
                      </span>
                    )}
                    {hasUnread && !hasMention && (
                      <span className="w-2 h-2 rounded-full bg-brand-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Private Channels */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span>Private Channels</span>
            <button
              onClick={() => setCreateChannelOpen(true)}
              className="p-1 hover:bg-white/10 rounded-md text-gray-300 hover:text-white transition-colors"
              title="Create Private Channel"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {privateChannels.map(channel => {
              const active = channel.id === currentChannelId;
              const hasUnread = (channel.unreadCount || 0) > 0;

              return (
                <button
                  key={channel.id}
                  onClick={() => setChannel(channel.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active 
                      ? 'bg-brand-600/20 text-brand-400 font-semibold' 
                      : hasUnread 
                      ? 'text-white font-bold bg-white/5' 
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate">{channel.name}</span>
                  </div>
                  {hasUnread && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Direct Messages */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span>Direct Messages</span>
            <button
              onClick={() => setInviteOpen(true)}
              className="p-1 hover:bg-white/10 rounded-md text-gray-300 hover:text-white transition-colors"
              title="Invite Teammate"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1 px-1">
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-white/5 cursor-pointer">
              <div className="relative">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces" className="w-6 h-6 rounded-full object-cover" alt="Alex" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-brand-500 rounded-full border border-[#1a1d21]" />
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-white">Alex Rivers</p>
                <p className="text-[10px] text-gray-500 truncate">Engineering Lead</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-white/5 cursor-pointer">
              <div className="relative">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces" className="w-6 h-6 rounded-full object-cover" alt="Jordan" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-brand-500 rounded-full border border-[#1a1d21]" />
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-white">Jordan Lee</p>
                <p className="text-[10px] text-gray-500 truncate">Product Designer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer User Info & Switcher */}
      <div className="p-3 border-t border-[#222529] bg-[#19171d] flex items-center justify-between">
        <div className="flex items-center gap-2.5 truncate">
          <img src={currentUser?.avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate">{currentUser?.displayName}</p>
            <p className="text-[10px] text-brand-400 font-medium">{currentUser?.status || 'Online'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => loginDemo(currentUser?.email.includes('alex') ? 'jordan' : 'alex')}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Switch Demo User (Alex / Jordan)"
          >
            <UserCheck className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
