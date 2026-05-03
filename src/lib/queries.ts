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
            user_id,
            checked_in,
            no_show,
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
        // Fetch event restrictions and user profile
        const { data: event } = await supabase
          .from('events')
          .select('min_age, max_age, gender_filter')
          .eq('id', eventId)
          .single();

        const { data: userProfile } = await supabase
          .from('users')
          .select('date_of_birth, gender')
          .eq('id', userId)
          .single();

        if (event && userProfile) {
          // Check gender
          if (event.gender_filter !== 'All' && userProfile.gender !== event.gender_filter) {
            throw new Error(`This event is for ${event.gender_filter} only`);
          }

          // Check age
          if (userProfile.date_of_birth) {
            const age = Math.floor((Date.now() - new Date(userProfile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            if (age < event.min_age || age > event.max_age) {
              throw new Error(`This event is for ages ${event.min_age}–${event.max_age} only`);
            }
          }
        }

        // RSVP
        const { error } = await supabase
          .from('attendees')
          .insert({ event_id: eventId, user_id: userId });
        if (error) {
          if (error.message.includes('Event is full')) {
            throw new Error('This event is full');
          }
          throw error;
        }
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

export function useAnnouncements(eventId: string) {
  return useQuery({
    queryKey: ['announcements', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*, users(display_name, avatar_url)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });
}

export function usePostAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, hostId, content }: { eventId: string; hostId: string; content: string }) => {
      const { data, error } = await supabase
        .from('announcements')
        .insert({ event_id: eventId, host_id: hostId, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['announcements', variables.eventId] });
    },
  });
}

export function subscribeToAnnouncements(eventId: string, onNew: () => void) {
  const channel = supabase
    .channel(`announcements:${eventId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'announcements', filter: `event_id=eq.${eventId}` },
      onNew
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, userId, checkedIn }: { eventId: string; userId: string; checkedIn: boolean }) => {
      const { error } = await supabase
        .from('attendees')
        .update({
          checked_in: checkedIn,
          no_show: !checkedIn,
        })
        .eq('event_id', eventId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: (_, { eventId, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['rsvp', eventId, userId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}

export function useFollowStatus(followingId: string, followerId?: string) {
  return useQuery({
    queryKey: ['follow', followingId, followerId],
    queryFn: async () => {
      if (!followerId) return false;
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();
      return !!data;
    },
    enabled: !!followerId && !!followingId,
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ followingId, followerId, isFollowing }: { followingId: string; followerId: string; isFollowing: boolean }) => {
      if (isFollowing) {
        await supabase.from('follows').delete()
          .eq('follower_id', followerId)
          .eq('following_id', followingId);
      } else {
        await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
      }
    },
    onSuccess: (_, { followingId, followerId }) => {
      queryClient.invalidateQueries({ queryKey: ['follow', followingId, followerId] });
      queryClient.invalidateQueries({ queryKey: ['followers', followingId] });
    },
  });
}

export function useFollowerCount(userId: string) {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
      return count || 0;
    },
    enabled: !!userId,
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
