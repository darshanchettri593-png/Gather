import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Event } from '@/types';

export function useEvents(vibeFilter: string, userId?: string) {
  return useQuery({
    queryKey: ['events', vibeFilter, userId],
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_events', {
        current_user_uuid: userId || null,
      });

      if (error) throw error;

      let events = (data || []).map((d: any) => ({
        ...d,
        host: d.users ?? null,
        _count: {
          attendees: d.attendee_count || 0,
        },
      })) as Event[];

      if (vibeFilter && vibeFilter !== 'All') {
        events = events.filter((e: any) => e.vibe === vibeFilter.toLowerCase());
      }

      return events;
    },
  });
}
