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
  const { event_id, content, host_id } = payload.record;

  const { data: event } = await supabase
    .from('events')
    .select('title')
    .eq('id', event_id)
    .single();

  const { data: attendees } = await supabase
    .from('attendees')
    .select('user_id')
    .eq('event_id', event_id)
    .neq('user_id', host_id);

  if (!attendees) return new Response('No attendees', { status: 200 });

  for (const attendee of attendees) {
    const { data: sub } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', attendee.user_id)
      .single();

    if (!sub) continue;

    try {
      await webpush.sendNotification(
        sub.subscription,
        JSON.stringify({
          title: `📣 ${event?.title}`,
          body: content.length > 100 ? content.substring(0, 100) + '...' : content,
          url: `/event/${event_id}`,
        })
      );
    } catch (err: any) {
      if (err.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('user_id', attendee.user_id);
      }
    }
  }

  return new Response('OK', { status: 200 });
});
