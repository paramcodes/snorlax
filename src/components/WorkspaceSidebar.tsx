import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Hash, Building2, UserCheck, Search } from 'lucide-react';

export const WorkspaceSidebar: React.FC = () => {
  const { workspaces, currentWorkspaceId, setWorkspace, createWorkspace, currentUser, loginDemo, setSearchOpen } = useStore();
  const [showNewWsModal, setShowNewWsModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    createWorkspace(newWsName.trim());
    setNewWsName('');
    setShowNewWsModal(false);
  };

  return (
    <div className="w-18 bg-[#19171d] flex flex-col items-center py-3 gap-3 border-r border-[#222529] select-none shrink-0">
      {/* App Logo / Brand Icon */}
      <div 
        className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-lg shadow-brand-600/30 cursor-pointer transition-transform hover:scale-105 active:scale-95"
        title="Snorlax Collaboration"
      >
        <span className="font-bold text-xl tracking-tighter">Sx</span>
      </div>

      <div className="w-8 h-[1px] bg-white/10 my-1" />

      {/* Workspaces List */}
      <div className="flex flex-col gap-2.5 w-full items-center overflow-y-auto px-1">
        {workspaces.map(ws => {
          const active = ws.id === currentWorkspaceId;
          const initials = ws.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          return (
            <button
              key={ws.id}
              onClick={() => setWorkspace(ws.id)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-sm transition-all relative group ${
                active 
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 rounded-lg' 
                  : 'bg-[#222529] text-gray-300 hover:bg-[#2c3136] hover:text-white rounded-2xl hover:rounded-xl'
              }`}
              title={ws.name}
            >
              {initials}
              {active && (
                <div className="absolute -left-1.5 w-1 h-6 bg-white rounded-r-full" />
              )}
            </button>
          );
        })}

        {/* Add Workspace Button */}
        <button
          onClick={() => setShowNewWsModal(true)}
          className="w-12 h-12 rounded-2xl bg-[#222529]/60 hover:bg-brand-600/20 hover:text-brand-400 text-gray-400 border border-dashed border-white/10 flex items-center justify-center transition-all group"
          title="Create New Workspace"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>
      </div>

      <div className="mt-auto flex flex-col items-center gap-3">
        {/* Search quick button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="w-10 h-10 rounded-xl bg-[#222529] hover:bg-[#2c3136] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          title="Search messages (Cmd+K)"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Current User Avatar / Switcher */}
        {currentUser ? (
          <div className="relative group">
            <img 
              src={currentUser.avatarUrl} 
              alt={currentUser.displayName}
              className="w-10 h-10 rounded-xl object-cover border-2 border-brand-500 cursor-pointer"
              title={`${currentUser.displayName} (${currentUser.email})`}
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-brand-500 rounded-full border-2 border-[#19171d]" />
          </div>
        ) : (
          <button
            onClick={() => loginDemo('alex')}
            className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs"
          >
            Login
          </button>
        )}
      </div>

      {/* New Workspace Modal */}
      {showNewWsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#222529] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-500" /> Create Workspace
            </h3>
            <p className="text-sm text-gray-400 mb-4">Workspaces house your teams, channels, and conversations.</p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Workspace Name</label>
                <input
                  type="text"
                  value={newWsName}
                  onChange={e => setNewWsName(e.target.value)}
                  placeholder="e.g. Acme Innovations"
                  className="w-full bg-[#1a1d21] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewWsModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 transition-all"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
