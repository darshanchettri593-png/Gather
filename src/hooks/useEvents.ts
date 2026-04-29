import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Event } from '@/types';

export function useEvents(vibeFilter: string, city: string, districtFilter: string) {
  return useQuery({
    queryKey: ['events', vibeFilter, districtFilter],
    staleTime: 0,
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select(`
          *,
          host:users!host_id(id, display_name, avatar_url),
          attendees!left(count)
        `)
        .gte('event_datetime', new Date().toISOString())
        .order('event_datetime', { ascending: true });

      if (vibeFilter !== 'All') {
        query = query.eq('vibe', vibeFilter.toLowerCase());
      }

      // Only filter by district when a specific one is selected.
      // City/state filter removed — was blocking all results with exact-match.
      if (districtFilter !== 'All') {
        query = query.eq('district', districtFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useEvents] Query error:', error);
        throw new Error(error.message);
      }

      return (data || []).map((d: any) => ({
        ...d,
        _count: {
          attendees: d.attendees?.[0]?.count || 0
        }
      })) as Event[];
    }
  });
}
