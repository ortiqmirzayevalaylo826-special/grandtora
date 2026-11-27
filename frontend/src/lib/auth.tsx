'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, refreshSession } from './client';

export interface AuthUser { id: string; email: string; role: 'STUDENT' | 'ADMIN'; firstName: string; lastName: string; locale: string; avatar?: string | null }
interface Ctx { user: AuthUser | null | undefined; setUser: (u: AuthUser | null) => void; logout: () => Promise<void> }
const AuthCtx = createContext<Ctx>({ user: undefined, setUser: () => {}, logout: async () => {} });
export const useAuth = () => useContext(AuthCtx);

/** Sahifa ochilganda sessiyani tiklaydi: /auth/me → 401 bo'lsa refresh → yana /auth/me. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  useEffect(() => {
    let off = false;
    (async () => {
      let me = await api<AuthUser>('/auth/me').catch(() => null);
      if (!me && (await refreshSession())) me = await api<AuthUser>('/auth/me').catch(() => null);
      if (!off) setUser(me);
    })();
    return () => { off = true; };
  }, []);
  const logout = useCallback(async () => { await api('/auth/logout', { method: 'POST' }).catch(() => null); setUser(null); }, []);
  const value = useMemo(() => ({ user, setUser, logout }), [user, logout]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
