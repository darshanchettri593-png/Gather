import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Event } from '@/types';

export function useEvents(vibeFilter: string) {
  return useQuery({
    queryKey: ['events', vibeFilter],
    staleTime: 0,
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select(`
          *,
          users!host_id(display_name, avatar_url),
          attendees(count)
        `)
        .gte('event_datetime', new Date().toISOString())
        .order('event_datetime', { ascending: true });

      if (vibeFilter && vibeFilter !== 'All') {
        query = query.eq('vibe', vibeFilter.toLowerCase());
      }

      const { data, error } = await query;

      console.log('[useEvents] data:', data);
      console.log('[useEvents] error:', error);

      if (error) throw error;

      return (data || []).map((d: any) => ({
        ...d,
        host: d.users ?? null,
        _count: {
          attendees: d.attendees?.[0]?.count || 0,
        },
      })) as Event[];
    },
  });
}
