import { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { authService } from './authService';
import { supabase } from '../../shared/supabase/client';
import { workspaceService } from '../workspaces/workspaceService';
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

  // Capture invite token from URL into sessionStorage on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const inviteToken = params.get('invite') || params.get('invite_token');
      if (inviteToken) {
        sessionStorage.setItem('pending_invite_token', inviteToken);
      }
    } catch (err) {
      console.error('Failed to capture invite token from URL:', err);
    }
  }, []);

  // Check and consume pending invite token if user session is active
  useEffect(() => {
    async function consumeInviteIfAny(userId: string) {
      const token = sessionStorage.getItem('pending_invite_token');
      if (!token) return;
      try {
        await workspaceService.joinWorkspaceByInvite(token, userId);
        sessionStorage.removeItem('pending_invite_token');
      } catch (err) {
        console.error('Failed to consume pending workspace invite:', err);
      }
    }

    if (session?.user?.id) {
      consumeInviteIfAny(session.user.id);
    }
  }, [session]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const currentSession = await authService.getSession();
        if (!mounted) return;
        setSession(currentSession);
        if (currentSession?.user) {
          if (currentSession.access_token) {
            try {
              supabase.realtime.setAuth(currentSession.access_token);
            } catch (realtimeAuthErr) {
              console.error('Failed to set realtime auth token on init:', realtimeAuthErr);
            }
          }
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

    const { data: subscription } = authService.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if (event === 'TOKEN_REFRESHED' && newSession) {
        // Silent JWT refresh: update session without unmounting state or clearing drafts
        setSession(newSession);
        if (newSession.access_token) {
          try {
            supabase.realtime.setAuth(newSession.access_token);
          } catch (realtimeAuthErr) {
            console.error('Failed to set realtime auth on token refresh:', realtimeAuthErr);
          }
        }
        return;
      }

      setSession(newSession);
      if (newSession?.user) {
        if (newSession.access_token) {
          try {
            supabase.realtime.setAuth(newSession.access_token);
          } catch (realtimeAuthErr) {
            console.error('Failed to set realtime auth on auth change:', realtimeAuthErr);
          }
        }
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
