import { create } from 'zustand'

type User = {
  id: string
  name: string
  email: string
  roles: string[]
  organizationId?: string
}

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
  login: (payload: { accessToken: string; refreshToken: string; user: User }) => void
  setTokens: (access: string, refresh: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null,
  refreshToken: typeof localStorage !== 'undefined' ? localStorage.getItem('refreshToken') : null,
  user:
    typeof localStorage !== 'undefined' && localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user') as string)
      : null,
  get isAuthenticated() {
    return !!get().accessToken
  },
  login: ({ accessToken, refreshToken, user }) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    set({ accessToken, refreshToken, user })
  },
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ accessToken, refreshToken })
  },
  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    set({ accessToken: null, refreshToken: null, user: null })
  },
}))


