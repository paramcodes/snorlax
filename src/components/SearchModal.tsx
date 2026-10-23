import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Search, X, Hash } from 'lucide-react';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setSearchOpen, messages, channels, setChannel } = useStore();
  const [query, setQuery] = useState('');

  if (!isSearchOpen) return null;

  const results = query.trim() 
    ? messages.filter(m => m.content.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 z-50 p-4">
      <div className="bg-[#222529] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search all messages in workspace..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-base focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 space-y-3">
          {query.trim() && results.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">No messages found matching "{query}"</div>
          )}
          {!query.trim() && (
            <div className="text-center py-8 text-gray-500 text-sm">Type keywords to search messages across channels.</div>
          )}
          {results.map(msg => {
            const chan = channels.find(c => c.id === msg.channelId);
            return (
              <div
                key={msg.id}
                onClick={() => {
                  if (chan) setChannel(chan.id);
                  setSearchOpen(false);
                }}
                className="bg-[#1a1d21] hover:bg-white/5 border border-white/5 rounded-xl p-3 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <img src={msg.userAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                    <span className="font-bold text-white text-xs">{msg.userName}</span>
                  </div>
                  {chan && (
                    <span className="flex items-center gap-1 text-[10px] text-brand-400 bg-brand-600/10 px-2 py-0.5 rounded-md font-medium">
                      <Hash className="w-3 h-3" /> {chan.name}
                    </span>
                  )}
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">{msg.content}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
