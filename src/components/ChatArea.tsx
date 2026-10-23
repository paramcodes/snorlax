import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  Hash, Lock, Search, Users, Send, Paperclip, Smile, 
  MessageSquare, MoreHorizontal, Edit2, Trash2, Check, X, Sparkles 
} from 'lucide-react';
import { Attachment } from '../types';

export const ChatArea: React.FC = () => {
  const { 
    channels, 
    currentChannelId, 
    messages, 
    sendMessage, 
    editMessage, 
    deleteMessage, 
    toggleReaction, 
    setCurrentThread, 
    setSearchOpen, 
    setInviteOpen,
    currentUser 
  } = useStore();

  const [inputContent, setInputContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChannel = channels.find(c => c.id === currentChannelId);
  const channelMessages = messages.filter(m => m.channelId === currentChannelId && !m.parentId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() && attachments.length === 0) return;
    sendMessage(inputContent.trim(), attachments);
    setInputContent('');
    setAttachments([]);
  };

  const handleAttachMock = () => {
    const mockFile: Attachment = {
      id: `att-${Date.now()}`,
      fileName: 'architecture-diagram.png',
      fileSize: 245000,
      contentType: 'image/png',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop',
    };
    setAttachments([...attachments, mockFile]);
  };

  const EMOJI_LIST = ['👍', '❤️', '🔥', '🎉', '🚀', '👀', '💯'];

  return (
    <div className="flex-1 flex flex-col bg-[#1a1d21] h-screen overflow-hidden">
      {/* Header */}
      <div className="h-14 px-6 border-b border-[#222529] flex items-center justify-between shrink-0 bg-[#1a1d21]/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-white text-lg">
            {currentChannel?.isPrivate ? <Lock className="w-5 h-5 text-amber-500" /> : <Hash className="w-5 h-5 text-brand-500" />}
            <span>{currentChannel?.name || 'select-channel'}</span>
          </div>
          {currentChannel?.topic && (
            <>
              <div className="w-[1px] h-4 bg-white/10" />
              <span className="text-xs text-gray-400 truncate max-w-md">{currentChannel.topic}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 bg-[#222529] hover:bg-[#2c3136] text-gray-400 hover:text-white px-3 py-1.5 rounded-xl text-xs transition-colors border border-white/5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search messages...</span>
            <kbd className="bg-[#1a1d21] px-1.5 py-0.5 rounded text-[10px] text-gray-400 border border-white/10">⌘K</kbd>
          </button>
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-brand-600/20 transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-[#222529]/60 border border-white/5 rounded-2xl p-5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-white font-bold text-base mb-1">
            Welcome to #{currentChannel?.name || 'channel'}!
          </h3>
          <p className="text-sm text-gray-400">
            This is the start of the #{currentChannel?.name} channel. Messages are securely stored and synced in real-time across your workspace.
          </p>
        </div>

        {channelMessages.map(msg => {
          const isMe = msg.userId === currentUser?.id;
          const isEditing = editingId === msg.id;
          const threadRepliesCount = messages.filter(m => m.parentId === msg.id).length;

          return (
            <div key={msg.id} className="flex gap-4 group hover:bg-[#222529]/30 p-2 rounded-xl transition-colors relative">
              <img src={msg.userAvatar} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-bold text-white text-sm">{msg.userName}</span>
                  <span className="text-[11px] text-gray-500">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.editedAt && <span className="text-[10px] text-gray-500 italic">(edited)</span>}
                </div>

                {isEditing ? (
                  <div className="space-y-2 mt-1">
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="w-full bg-[#1a1d21] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-brand-500"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (editContent.trim()) {
                            editMessage(msg.id, editContent.trim());
                            setEditingId(null);
                          }
                        }}
                        className="px-3 py-1 bg-brand-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-white/10 text-gray-300 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.attachments.map(att => (
                      <div key={att.id} className="border border-white/10 rounded-xl overflow-hidden bg-[#222529] max-w-xs">
                        <img src={att.url} alt="" className="w-full h-36 object-cover" />
                        <div className="p-2 text-xs text-gray-300 truncate font-medium">{att.fileName}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reactions */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {Object.entries(
                    msg.reactions.reduce((acc, r) => {
                      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([emoji, count]) => {
                    const reactedByMe = msg.reactions.some(r => r.userId === currentUser?.id && r.emoji === emoji);
                    return (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(msg.id, emoji)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          reactedByMe 
                            ? 'bg-brand-600/20 border-brand-500 text-brand-400' 
                            : 'bg-[#222529] border-white/5 text-gray-300 hover:border-white/20'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="text-[11px] font-semibold">{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Thread summary */}
                {threadRepliesCount > 0 && (
                  <button
                    onClick={() => setCurrentThread(msg.id)}
                    className="flex items-center gap-1.5 mt-2 text-xs text-brand-400 font-semibold hover:underline"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{threadRepliesCount} {threadRepliesCount === 1 ? 'reply' : 'replies'}</span>
                    <span className="text-gray-500 font-normal">Last reply recently</span>
                  </button>
                )}
              </div>

              {/* Hover Actions Toolbar */}
              <div className="absolute right-4 -top-3 hidden group-hover:flex items-center gap-1 bg-[#222529] border border-white/10 rounded-xl p-1 shadow-xl z-10">
                <button
                  onClick={() => toggleReaction(msg.id, '👍')}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                  title="Quick Like"
                >
                  👍
                </button>
                <button
                  onClick={() => setShowEmojiPickerFor(showEmojiPickerFor === msg.id ? null : msg.id)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                  title="Add Reaction"
                >
                  <Smile className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentThread(msg.id)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                  title="Reply in Thread"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                {isMe && (
                  <>
                    <button
                      onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                      title="Edit Message"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Emoji Picker Popup */}
              {showEmojiPickerFor === msg.id && (
                <div className="absolute right-12 top-6 bg-[#222529] border border-white/10 rounded-xl p-2 shadow-2xl flex gap-1 z-20">
                  {EMOJI_LIST.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => { toggleReaction(msg.id, emoji); setShowEmojiPickerFor(null); }}
                      className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-base transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="p-4 bg-[#1a1d21] border-t border-[#222529]">
        <form onSubmit={handleSend} className="bg-[#222529] border border-white/10 rounded-2xl p-3 shadow-lg focus-within:border-brand-500 transition-colors">
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-3 pb-3 border-b border-white/10 overflow-x-auto">
              {attachments.map(att => (
                <div key={att.id} className="relative group bg-[#1a1d21] border border-white/10 rounded-xl p-2 flex items-center gap-2">
                  <img src={att.url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <span className="text-xs text-white truncate max-w-[120px]">{att.fileName}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))}
                    className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={inputContent}
            onChange={e => setInputContent(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder={`Message #${currentChannel?.name || 'channel'}`}
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none resize-none min-h-[44px] max-h-36"
            rows={2}
          />

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleAttachMock}
                className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                title="Add emoji"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={!inputContent.trim() && attachments.length === 0}
              className="bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-brand-600/30 transition-all flex items-center gap-1.5"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
