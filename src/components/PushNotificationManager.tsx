'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/contexts/AppContext'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

async function subscribeUser() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })
}

export function PushNotificationManager() {
  const { userId } = useApp()
  const [asked, setAsked] = useState(false)

  useEffect(() => {
    if (!userId || asked) return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    // Jangan tanya ulang jika sudah granted/denied
    if (Notification.permission !== 'default') {
      if (Notification.permission === 'granted') registerSub()
      return
    }

    // Tanya izin setelah 3 detik (biar app sudah stabil)
    const t = setTimeout(async () => {
      setAsked(true)
      const permission = await Notification.requestPermission()
      if (permission === 'granted') registerSub()
    }, 3000)

    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function registerSub() {
    try {
      const sub = await subscribeUser()
      if (!sub) return
      const json = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        }),
      })
    } catch (err) {
      console.error('[push] gagal subscribe:', err)
    }
  }

  return null // tidak render apapun
}
