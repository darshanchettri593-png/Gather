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
        .order('event_datetime', { ascending: true });
      // Date filter removed — was blocking events due to timezone mismatches

      if (vibeFilter && vibeFilter !== 'All') {
        query = query.eq('vibe', vibeFilter.toLowerCase());
      }

      if (districtFilter && districtFilter !== 'All') {
        query = query.eq('district', districtFilter);
      }

      const { data, error } = await query;

      console.log('[useEvents] data:', data);
      console.log('[useEvents] error:', error);

      if (error) throw error;

      return (data || []).map((d: any) => ({
        ...d,
        _count: {
          attendees: d.attendees?.[0]?.count || 0,
        },
      })) as Event[];
    },
  });
}
