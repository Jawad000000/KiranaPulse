'use client';
import { useState } from 'react';
import TopNav from '@/components/TopNav';
import SupabaseBootstrap from '@/components/SupabaseBootstrap';
import ChatBoard from '@/components/ChatBoard';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-full flex flex-col bg-beige">
      <SupabaseBootstrap />
      <TopNav onToggleChat={() => setChatOpen(prev => !prev)} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {children}
      </main>
      <ChatBoard isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
