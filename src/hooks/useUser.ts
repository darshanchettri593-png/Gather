import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export function useUserEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userEvents', user?.id],
    queryFn: async () => {
      if (!user) return { hosted: [], joined: [] };

      // Get events user is hosting
      const { data: hostedData, error: hostedError } = await supabase
        .from('events')
        .select(`
          *,
          attendees(count)
        `)
        .eq('host_id', user.id)
        .order('event_datetime', { ascending: false });

      if (hostedError) throw hostedError;

      // Get events user has joined
      const { data: joinedData, error: joinedError } = await supabase
        .from('attendees')
        .select(`
          event_id,
          events (
            *,
            attendees(count)
          )
        `)
        .eq('user_id', user.id)
        .order('events(event_datetime)', { ascending: false });

      if (joinedError) throw joinedError;

      const formatEventData = (eventsList: any[]) => eventsList.map((e: any) => ({
        ...e,
        _count: { attendees: e.attendees?.[0]?.count || 0 }
      }));

      const formattedHosted = formatEventData(hostedData || []);
      const formattedJoined = joinedData?.map(j => ({
        ...(j.events as any),
        _count: { attendees: (j.events as any)?.attendees?.[0]?.count || 0 }
      })) || [];

      return {
        hosted: formattedHosted,
        joined: formattedJoined
      };
    },
    enabled: !!user
  });
}

export function useProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  })
}
