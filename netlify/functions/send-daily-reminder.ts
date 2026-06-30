import type { Config } from '@netlify/functions'

// Jam 09.00 WIB = 02.00 UTC | Jam 16.00 WIB = 09.00 UTC
export const config: Config = {
  schedule: '0 2,9 * * *',
}

export default async function handler() {
  const url = process.env.NEXT_PUBLIC_APP_URL
  const secret = process.env.PUSH_SEND_SECRET

  if (!url) {
    console.error('NEXT_PUBLIC_APP_URL tidak di-set')
    return
  }

  const res = await fetch(`${url}/api/push/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
  })

  const data = await res.json()
  console.log('[daily-reminder]', data)
}
