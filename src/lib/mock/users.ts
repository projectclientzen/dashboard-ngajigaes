import type { User } from '@/types'

export const MOCK_USERS: User[] = [
  {
    id: 'user-leader-01',
    name: 'Zen Ardiansyah',
    email: 'zen@ngajigaes.id',
    role: 'leader',
    avatar_url: null,
    status: 'active',
    joined_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-feed-01',
    name: 'Rina Kusuma',
    email: 'rina@ngajigaes.id',
    role: 'feed_socmed',
    avatar_url: null,
    status: 'active',
    joined_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 'user-reels-01',
    name: 'Bagas Pratama',
    email: 'bagas@ngajigaes.id',
    role: 'reels_ads',
    avatar_url: null,
    status: 'active',
    joined_at: '2024-02-15T00:00:00Z',
  },
  {
    id: 'user-curator-01',
    name: 'Sari Dewi',
    email: 'sari@ngajigaes.id',
    role: 'curator',
    avatar_url: null,
    status: 'active',
    joined_at: '2024-03-01T00:00:00Z',
  },
]

// Skenario login mock
export const MOCK_LEADER = MOCK_USERS[0]
export const MOCK_TEAM_MEMBER = MOCK_USERS[1]  // feed_socmed
