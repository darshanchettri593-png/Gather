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
  const { follower_id, following_id } = payload.record;

  const { data: follower } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', follower_id)
    .single();

  const { data: sub } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', following_id)
    .single();

  if (!sub) return new Response('No subscription', { status: 200 });

  try {
    await webpush.sendNotification(
      sub.subscription,
      JSON.stringify({
        title: 'New follower 👋',
        body: `${follower?.display_name || 'Someone'} started following you`,
        url: `/user/${follower_id}`,
      })
    );
  } catch (err: any) {
    if (err.statusCode === 410) {
      await supabase.from('push_subscriptions').delete().eq('user_id', following_id);
    }
  }

  return new Response('OK', { status: 200 });
});
