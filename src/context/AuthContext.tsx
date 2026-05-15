import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContextValue, SignInPayload, SignUpPayload, User } from '@/types/auth';
import { createLocalUser, getCurrentUser, loginLocalUser, logoutLocalUser } from '@/services/authStorage';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadCurrentUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(payload: SignInPayload) {
    const loggedUser = await loginLocalUser(payload);
    setUser(loggedUser);
  }

  async function signUp(payload: SignUpPayload) {
    const createdUser = await createLocalUser(payload);
    setUser(createdUser);
  }

  async function signOut() {
    await logoutLocalUser();
    setUser(null);
  }

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      signIn,
      signUp,
      signOut
    };
  }, [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de AuthProvider.');
  }

  return context;
}