const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(userId: string, supabase: any) {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push not supported');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    console.log('SW ready:', registration);

    const permission = await Notification.requestPermission();
    console.log('Permission:', permission);
    if (permission !== 'granted') return;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log('Subscription:', subscription);

    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      subscription: subscription.toJSON(),
    }, { onConflict: 'user_id' });

    if (error) console.error('Supabase upsert error:', error);
    else console.log('Push subscription saved successfully');

  } catch (err) {
    console.error('Push subscription failed:', err);
  }
}
