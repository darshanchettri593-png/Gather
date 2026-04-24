import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EventRating } from '@/types';

// ─── Fetch all ratings for an event ──────────────────────────────────────────

export function useEventRatings(eventId: string) {
  return useQuery({
    queryKey: ['ratings', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_ratings')
        .select(`
          *,
          rater:users!rater_id(id, display_name, avatar_url)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EventRating[];
    },
    enabled: !!eventId,
    staleTime: 30_000,
  });
}

// ─── Fetch the current user's own rating for an event ────────────────────────

export function useMyRating(eventId: string, userId: string | undefined) {
  return useQuery({
    queryKey: ['myRating', eventId, userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('event_ratings')
        .select('*')
        .eq('event_id', eventId)
        .eq('rater_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as EventRating | null;
    },
    enabled: !!eventId && !!userId,
    staleTime: 30_000,
  });
}

// ─── Submit or update a rating (upsert on event_id + rater_id) ───────────────

export function useSubmitRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      raterId,
      raterType,
      ratingValue,
      comment,
    }: {
      eventId: string;
      raterId: string;
      raterType: 'attendee' | 'host';
      ratingValue: number;
      comment?: string;
    }) => {
      console.log('[Rating] upsert', { eventId, raterId, raterType, ratingValue });
      const { data, error } = await supabase
        .from('event_ratings')
        .upsert(
          {
            event_id: eventId,
            rater_id: raterId,
            rater_type: raterType,
            rating_value: ratingValue,
            comment: comment || null,
          },
          { onConflict: 'event_id,rater_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as EventRating;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ratings', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['myRating', variables.eventId, variables.raterId] });
      queryClient.invalidateQueries({ queryKey: ['ratingSummary', variables.eventId] });
    },
  });
}

// ─── Aggregate summary for a single event (used on profile cards) ────────────

export interface RatingSummary {
  avg: number;
  count: number;
}

export function useEventRatingSummary(eventId: string, enabled = true) {
  return useQuery({
    queryKey: ['ratingSummary', eventId],
    queryFn: async () => {
      // Fetch only attendee ratings — those represent "how good was the event/host"
      const { data, error } = await supabase
        .from('event_ratings')
        .select('rating_value')
        .eq('event_id', eventId)
        .eq('rater_type', 'attendee');

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const avg = data.reduce((sum, r) => sum + r.rating_value, 0) / data.length;
      return { avg: Math.round(avg * 10) / 10, count: data.length } as RatingSummary;
    },
    enabled: enabled && !!eventId,
    staleTime: 60_000,
  });
}
