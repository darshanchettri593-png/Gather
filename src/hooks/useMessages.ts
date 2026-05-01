import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
    enabled: !!eventId,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, user:users!user_id(id, display_name, avatar_url)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);
      return (data || []) as Message[];
    },
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

      console.log('[Chat] insert result:', data, error);

      if (error) {
        console.error('[Chat] RLS error:', error.message, error.code);
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', eventId] });
    },
  });
}

// Call inside the component that mounts the chat section.
// Returns a cleanup function — call it in useEffect's return.
export function subscribeToMessages(eventId: string, onNew: () => void) {
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
      onNew
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
