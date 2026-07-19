import type { Config } from '@netlify/functions'

// Sync Repliz tiap 6 jam (status schedule + engagement)
export const config: Config = {
  schedule: '0 */6 * * *',
}

export default async function handler() {
  const url = process.env.NEXT_PUBLIC_APP_URL
  const secret = process.env.PUSH_SEND_SECRET
  if (!url) {
    console.error('NEXT_PUBLIC_APP_URL tidak di-set')
    return
  }
  const res = await fetch(`${url}/api/repliz/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
  })
  const data = await res.json()
  console.log('[repliz-sync]', data)
}
