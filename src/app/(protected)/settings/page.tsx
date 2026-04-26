'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { userRole, activeUserId, partners } = useStore();
  const activePartner = partners.find(partner => partner.id === activeUserId);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email);
      }
    });
  }, [supabase]);

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-sans font-bold text-dark">System Configuration</h1>
        <div className="font-sans text-sm text-gray-500 mt-1">Operator settings</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card-soft flex flex-col gap-6">
          <h2 className="text-xl font-sans font-bold text-dark border-b border-gray-100 pb-4">Profile</h2>
          
          <div className="font-sans">
            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Operator ID</div>
            <div className="font-medium text-lg text-dark">{userEmail || 'Loading...'}</div>
          </div>
          
          <div className="font-sans">
            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Role Level</div>
            <div className="badge-soft bg-dark text-white">{userRole.toUpperCase()}</div>
          </div>
          
          <div className="font-sans">
            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Organization</div>
            <div className="font-medium text-dark">{activePartner?.name ?? 'KiranaPulse Workspace'}</div>
          </div>
        </div>
        
        <div className="card-soft flex flex-col gap-6">
          <h2 className="text-xl font-sans font-bold text-dark border-b border-gray-100 pb-4">System Status</h2>
          
          <div className="font-sans">
            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Connection</div>
            <div className="badge-soft bg-green-50 text-green-600 border border-green-100">ONLINE</div>
          </div>
          
          <div className="font-sans">
            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Auto-Trigger Rules</div>
            <div className="text-dark bg-gray-50 p-4 rounded-xl mt-2 border border-gray-100">
              <div className="mb-2"><span className="font-bold">Threshold:</span> &lt; 30% Capacity</div>
              <div><span className="font-bold">Action:</span> Create Draft Order</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/login');
          }}
          className="btn-pill bg-white text-signal-red border border-signal-red hover:bg-red-50 shadow-sm inline-block px-8 py-3"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
