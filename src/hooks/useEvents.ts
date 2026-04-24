import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Event } from '@/types';

export function useEvents(vibeFilter: string, locationFilter?: string) {
  return useQuery({
    queryKey: ['events', vibeFilter, locationFilter],
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

      if (locationFilter && locationFilter !== "India" && locationFilter !== "All Locations") {
        // Simple client-side or ilike filter
        // Since we are creating custom strings, we can use ilike for partial matches like "Kolkata" matching "Kolkata, West Bengal"
        const primaryCity = locationFilter.split(',')[0].trim();
        query = query.ilike('location_text', `%${primaryCity}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Map Supabase attendee count array length syntax
      return (data || []).map((d: any) => ({
        ...d,
        _count: {
          attendees: d.attendees?.[0]?.count || 0
        }
      })) as Event[];
    }
  });
}
