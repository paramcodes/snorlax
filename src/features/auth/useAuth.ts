import { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { authService } from './authService';
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const profile = await authService.getUserProfile(userId);
      setUser(profile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const currentSession = await authService.getSession();
        if (!mounted) return;
        setSession(currentSession);
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setUser(null);
        }
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Authentication initialization failed');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const { data: subscription } = authService.onAuthStateChange(async (newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.signIn(email, pass);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, displayName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.signUp(email, pass, displayName);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.signOut();
      setUser(null);
      setSession(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    session,
    user,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
  };
}
