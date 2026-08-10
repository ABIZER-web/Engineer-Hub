// frontend/src/utils/push.js
import { subscribePush as apiSubscribe, unsubscribePush as apiUnsubscribe } from '../services/api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

// Web Push requires the VAPID key as a Uint8Array, but env vars are strings —
// this is the standard base64url -> Uint8Array conversion for that.
const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
};

export const isPushSupported = () =>
    'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY;

export const getPushSubscription = async () => {
    if (!isPushSupported()) return null;
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
};

export const subscribeToPush = async () => {
    if (!isPushSupported()) throw new Error('Push notifications are not supported in this browser');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Notification permission was denied');

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
        sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
    }

    await apiSubscribe({
        endpoint: sub.endpoint,
        keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))),
            auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))),
        },
        userAgent: navigator.userAgent,
    });

    return sub;
};

export const unsubscribeFromPush = async () => {
    const sub = await getPushSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    try { await apiUnsubscribe(endpoint); } catch { /* best-effort — the browser-side unsubscribe already succeeded */ }
};
