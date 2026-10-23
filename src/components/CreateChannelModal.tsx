import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Hash, Lock, X } from 'lucide-react';

export const CreateChannelModal: React.FC = () => {
  const { isCreateChannelOpen, setCreateChannelOpen, createChannel } = useStore();
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  if (!isCreateChannelOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createChannel(name.trim(), topic.trim(), isPrivate);
    setName('');
    setTopic('');
    setIsPrivate(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#222529] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Hash className="w-5 h-5 text-brand-500" /> Create a channel
          </h3>
          <button
            onClick={() => setCreateChannelOpen(false)}
            className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Channel Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. project-x"
              className="w-full bg-[#1a1d21] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Topic (optional)</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="What is this channel about?"
              className="w-full bg-[#1a1d21] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-sm font-semibold text-white">Make private</div>
              <div className="text-xs text-gray-400">When a channel is private, it can only be viewed or joined by invitation.</div>
            </div>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={e => setIsPrivate(e.target.checked)}
              className="w-5 h-5 accent-brand-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setCreateChannelOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white shadow-lg shadow-brand-600/30 transition-all"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
