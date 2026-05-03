import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Message {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useMessages(eventId: string) {
  return useQuery({
    queryKey: ['messages', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, user:users!user_id(id, display_name, avatar_url)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      userId,
      content,
    }: {
      eventId: string;
      userId: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({ event_id: eventId, user_id: userId, content: content.trim() })
        .select();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', eventId] });
    },
  });
}

export function subscribeToMessages(eventId: string, queryClient: any) {
  const channel = supabase
    .channel(`messages:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `event_id=eq.${eventId}`,
      },
      async (payload) => {
        // Fetch the new message with user data
        const { data: newMessage } = await supabase
          .from('messages')
          .select('*, user:users!user_id(id, display_name, avatar_url)')
          .eq('id', payload.new.id)
          .single();

        if (!newMessage) return;

        // Append directly to cache — no refetch needed
        queryClient.setQueryData(['messages', eventId], (old: any[]) => {
          if (!old) return [newMessage];
          // Avoid duplicates
          if (old.find((m: any) => m.id === newMessage.id)) return old;
          return [...old, newMessage];
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
