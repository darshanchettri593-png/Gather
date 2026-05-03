import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push';

webpush.setVapidDetails(
  Deno.env.get('VAPID_EMAIL')!,
  Deno.env.get('VITE_VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
);

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async () => {
  // Find events starting in the next 24-25 hours
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const { data: events } = await supabase
    .from('events')
    .select('id, title, event_datetime, location_text')
    .gte('event_datetime', in24h.toISOString())
    .lte('event_datetime', in25h.toISOString());

  if (!events || events.length === 0) {
    return new Response('No events in window', { status: 200 });
  }

  for (const event of events) {
    // Get all attendees for this event
    const { data: attendees } = await supabase
      .from('attendees')
      .select('user_id')
      .eq('event_id', event.id);

    if (!attendees) continue;

    for (const attendee of attendees) {
      // Get their push subscription
      const { data: sub } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', attendee.user_id)
        .single();

      if (!sub) continue;

      const eventTime = new Date(event.event_datetime).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify({
            title: `${event.title} is tomorrow 🔥`,
            body: `Starts at ${eventTime} · ${event.location_text}`,
            url: `/event/${event.id}`,
          })
        );
      } catch (err: any) {
        // Subscription expired — remove it
        if (err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('user_id', attendee.user_id);
        }
      }
    }
  }

  return new Response('Reminders sent', { status: 200 });
});
