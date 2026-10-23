import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Users, X, Copy, Check } from 'lucide-react';

export const InviteModal: React.FC = () => {
  const { isInviteOpen, setInviteOpen, workspaces, currentWorkspaceId } = useStore();
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isInviteOpen) return null;

  const currentWs = workspaces.find(w => w.id === currentWorkspaceId);
  const inviteLink = `https://snorlax.dev/invite/${currentWs?.slug || 'workspace'}-${Math.random().toString(36).substring(7)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#222529] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-500" /> Invite teammates to {currentWs?.name}
          </h3>
          <button
            onClick={() => setInviteOpen(false)}
            className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Invite Link</label>
            <div className="flex items-center gap-2 bg-[#1a1d21] border border-white/10 rounded-xl px-3 py-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 bg-transparent text-white text-xs focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Or send invitation email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 bg-[#1a1d21] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={() => {
                  if (email) {
                    alert(`Invitation sent to ${email}!`);
                    setEmail('');
                    setInviteOpen(false);
                  }
                }}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-600/30"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
