import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useEventDetail(eventId: string) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          host:users!host_id (id, display_name, avatar_url),
          attendees (
            id,
            user:users!user_id (id, display_name, avatar_url)
          )
        `)
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

export function useRSVPStatus(eventId: string, userId?: string) {
  return useQuery({
    queryKey: ['rsvp', eventId, userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from('attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!eventId && !!userId,
  });
}

export function useToggleRSVP() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, userId, isAttending }: { eventId: string, userId: string, isAttending: boolean }) => {
      if (isAttending) {
        // Cancel RSVP
        const { error } = await supabase
          .from('attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // RSVP
        const { error } = await supabase
          .from('attendees')
          .insert({ event_id: eventId, user_id: userId });
        if (error) throw error;
      }
    },
    onMutate: async ({ eventId, userId, isAttending }) => {
      await queryClient.cancelQueries({ queryKey: ['rsvp', eventId, userId] });
      await queryClient.cancelQueries({ queryKey: ['event', eventId] });

      const previousRSVP = queryClient.getQueryData(['rsvp', eventId, userId]);
      
      // Optimistically update
      queryClient.setQueryData(['rsvp', eventId, userId], !isAttending);
      
      return { previousRSVP };
    },
    onError: (err, variables, context: any) => {
      // Revert if error
      if (context?.previousRSVP !== undefined) {
        queryClient.setQueryData(['rsvp', variables.eventId, variables.userId], context.previousRSVP);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rsvp', variables.eventId, variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
    }
  });
}

export function useTrendingEvents() {
  return useQuery({
    queryKey: ['trending-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_datetime,
          cover_image_url,
          location_text,
          _count:attendees(count)
        `)
        .gte('event_datetime', new Date().toISOString())
        .order('created_at', { ascending: false }); // There is no direct attendee count order in simple supabase JS without a view or rpc, so we will fetch all future and sort in JS
      
      if (error) throw error;
      
      // Sort in JS by attendee count desc
      const sorted = (data as any[]).sort((a, b) => {
        const countA = a._count?.[0]?.count || a._count?.count || 0;
        const countB = b._count?.[0]?.count || b._count?.count || 0;
        return countB - countA;
      }).slice(0, 5);

      return sorted;
    },
    staleTime: 60 * 1000,
  });
}

export function useLiveEventsSearch(query: string) {
  return useQuery({
    queryKey: ['search-events', query],
    queryFn: async () => {
      if (!query || query.length < 1) return [];

      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_datetime,
          cover_image_url,
          location_text,
          _count:attendees(count)
        `)
        .gte('event_datetime', new Date().toISOString())
        .or(`title.ilike.%${query}%,location_text.ilike.%${query}%`)
        .order('event_datetime', { ascending: true })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    staleTime: 0,
    enabled: query.length > 0,
  });
}

export function useLiveHostsSearch(query: string) {
  return useQuery({
    queryKey: ['search-hosts', query],
    queryFn: async () => {
      if (!query || query.length < 1) return [];

      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          display_name,
          avatar_url,
          _count:events!events_host_id_fkey(count)
        `)
        .ilike('display_name', `%${query}%`)
        .limit(5);

      if (error) throw error;
      return data;
    },
    staleTime: 0,
    enabled: query.length > 0,
  });
}
