import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Event } from '@/types';

export function useEvents(vibeFilter: string, city: string, districtFilter: string) {
  return useQuery({
    queryKey: ['events', vibeFilter, city, districtFilter],
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

      if (districtFilter !== 'All') {
        query = query.eq('district', districtFilter);
      }

      if (city && city !== "All Locations") {
        query = query.eq('city', city);
      }

      const { data, error } = await query;

      if (error) {
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
