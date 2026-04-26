'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';

export default function SupabaseBootstrap() {
  const hydrateFromSupabase = useStore(state => state.hydrateFromSupabase);
  const activeUserId = useStore(state => state.activeUserId);
  const isHydrated = useStore(state => state.isHydrated);

  useEffect(() => {
    const supabase = createClient();
    void hydrateFromSupabase(supabase);
  }, [hydrateFromSupabase]);

  useEffect(() => {
    if (!isHydrated || !activeUserId) return;

    const supabase = createClient();
    const refresh = () => {
      void hydrateFromSupabase(supabase);
    };

    const channel = supabase
      .channel(`kiranapulse:${activeUserId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `target_org_id=eq.${activeUserId}`,
      }, refresh)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `requester_org_id=eq.${activeUserId}`,
      }, refresh)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'alert_recipients',
        filter: `org_id=eq.${activeUserId}`,
      }, refresh)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeUserId, hydrateFromSupabase, isHydrated]);

  return null;
}
