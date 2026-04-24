import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Event } from '@/types';

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, coverImageUrl }: { eventId: string; coverImageUrl?: string | null }) => {
      console.log('[DeleteEvent] Deleting event:', eventId);

      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw new Error(error.message);

      // Best-effort storage cleanup — don't block or throw on failure
      if (coverImageUrl) {
        const path = coverImageUrl.split('/event-covers/')[1];
        if (path) {
          console.log('[DeleteEvent] Removing cover image:', path);
          await supabase.storage.from('event-covers').remove([path]).catch((err) =>
            console.warn('[DeleteEvent] Storage cleanup failed (non-fatal):', err)
          );
        }
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.removeQueries({ queryKey: ['event', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['userEvents'] });
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      if (!id) throw new Error("Event ID not provided");
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          host:users!host_id(id, display_name, avatar_url),
          attendees(id, joined_at, user:users!user_id(id, display_name, avatar_url))
        `)
        .eq('id', id)
        .single();
        
      if (error) throw new Error(error.message);

      // Post-process so signature matches
      const processed = {
        ...data,
        _count: {
          attendees: data.attendees?.length || 0
        }
      } as Event;

      return { processed, attendeesRaw: data.attendees || [] };
    },
    enabled: !!id
  });
}

export function useRSVP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, userId, isAttending }: { eventId: string, userId: string, isAttending: boolean }) => {
      if (isAttending) {
        // Leave
        const { error } = await supabase
          .from('attendees')
          .delete()
          .match({ event_id: eventId, user_id: userId });
        if (error) throw new Error(error.message);
      } else {
        // Join
        const { error } = await supabase
          .from('attendees')
          .insert({ event_id: eventId, user_id: userId });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['userEvents'] });
    }
  });
}
