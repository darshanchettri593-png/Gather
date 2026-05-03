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

Deno.serve(async (req) => {
  const payload = await req.json();
  const { event_id, user_id } = payload.record;

  // Get event and host info
  const { data: event } = await supabase
    .from('events')
    .select('title, host_id')
    .eq('id', event_id)
    .single();

  if (!event) return new Response('Event not found', { status: 404 });

  // Don't notify if host RSVPs their own event
  if (event.host_id === user_id) return new Response('Host RSVP', { status: 200 });

  // Get joining user's name
  const { data: joiningUser } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user_id)
    .single();

  // Get host's push subscription
  const { data: sub } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', event.host_id)
    .single();

  if (!sub) return new Response('No subscription', { status: 200 });

  try {
    await webpush.sendNotification(
      sub.subscription,
      JSON.stringify({
        title: `New guest for ${event.title} 🎉`,
        body: `${joiningUser?.display_name || 'Someone'} just joined your event`,
        url: `/event/${event_id}`,
      })
    );
  } catch (err: any) {
    if (err.statusCode === 410) {
      await supabase.from('push_subscriptions').delete().eq('user_id', event.host_id);
    }
  }

  return new Response('Notification sent', { status: 200 });
});
