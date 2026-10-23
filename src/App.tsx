import React from 'react';
import { WorkspaceSidebar } from './components/WorkspaceSidebar';
import { ChannelSidebar } from './components/ChannelSidebar';
import { ChatArea } from './components/ChatArea';
import { ThreadPanel } from './components/ThreadPanel';
import { SearchModal } from './components/SearchModal';
import { CreateChannelModal } from './components/CreateChannelModal';
import { InviteModal } from './components/InviteModal';

export function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#1a1d21]">
      <WorkspaceSidebar />
      <ChannelSidebar />
      <ChatArea />
      <ThreadPanel />
      <SearchModal />
      <CreateChannelModal />
      <InviteModal />
    </div>
  );
}

export default App;
