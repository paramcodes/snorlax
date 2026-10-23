import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Send, MessageSquare } from 'lucide-react';

export const ThreadPanel: React.FC = () => {
  const { currentThreadMessageId, setCurrentThread, messages, sendMessage, currentUser } = useStore();
  const [replyContent, setReplyContent] = useState('');

  if (!currentThreadMessageId) return null;

  const parentMessage = messages.find(m => m.id === currentThreadMessageId);
  const replies = messages.filter(m => m.parentId === currentThreadMessageId);

  if (!parentMessage) return null;

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    sendMessage(replyContent.trim(), [], currentThreadMessageId);
    setReplyContent('');
  };

  return (
    <div className="w-80 bg-[#19171d] border-l border-[#222529] flex flex-col h-screen select-none shrink-0 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-14 px-4 border-b border-[#222529] flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-white text-sm">
          <MessageSquare className="w-4 h-4 text-brand-500" />
          <span>Thread</span>
        </div>
        <button
          onClick={() => setCurrentThread(null)}
          className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Parent Message */}
        <div className="flex gap-3 pb-4 border-b border-white/10">
          <img src={parentMessage.userAvatar} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-bold text-white text-xs">{parentMessage.userName}</span>
              <span className="text-[10px] text-gray-500">
                {new Date(parentMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-gray-200 text-xs leading-relaxed">{parentMessage.content}</p>
          </div>
        </div>

        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
        </div>

        {/* Replies */}
        {replies.map(reply => (
          <div key={reply.id} className="flex gap-3">
            <img src={reply.userAvatar} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
            <div>
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-bold text-white text-xs">{reply.userName}</span>
                <span className="text-[10px] text-gray-500">
                  {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-gray-200 text-xs leading-relaxed">{reply.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reply input */}
      <div className="p-3 border-t border-[#222529]">
        <form onSubmit={handleReply} className="bg-[#222529] border border-white/10 rounded-xl p-2.5 flex items-center gap-2">
          <input
            type="text"
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            placeholder="Reply..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-xs focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={!replyContent.trim()}
            className="p-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white rounded-lg transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
