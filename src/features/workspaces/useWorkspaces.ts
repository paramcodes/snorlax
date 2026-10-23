import { useState, useEffect, useCallback } from 'react';
import { Workspace } from '../../types';
import { workspaceService } from './workspaceService';

export function useWorkspaces(userId: string | undefined) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaces = useCallback(async () => {
    if (!userId) {
      setWorkspaces([]);
      setCurrentWorkspaceId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const list = await workspaceService.fetchUserWorkspaces(userId);
      setWorkspaces(list);
      if (list.length > 0 && (!currentWorkspaceId || !list.some((w) => w.id === currentWorkspaceId))) {
        setCurrentWorkspaceId(list[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentWorkspaceId]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const createWorkspace = async (name: string): Promise<Workspace> => {
    if (!userId) throw new Error('User not authenticated');
    const newWs = await workspaceService.createWorkspace(name, userId);
    setWorkspaces((prev) => [...prev, newWs]);
    setCurrentWorkspaceId(newWs.id);
    return newWs;
  };

  const inviteUser = async (workspaceId: string, email: string): Promise<string> => {
    const { token } = await workspaceService.createInvitation(workspaceId, email);
    return token;
  };

  const joinByInvite = async (token: string): Promise<string> => {
    if (!userId) throw new Error('User not authenticated');
    const wsId = await workspaceService.joinWorkspaceByInvite(token, userId);
    await loadWorkspaces();
    setCurrentWorkspaceId(wsId);
    return wsId;
  };

  return {
    workspaces,
    currentWorkspaceId,
    setCurrentWorkspaceId,
    isLoading,
    error,
    createWorkspace,
    inviteUser,
    joinByInvite,
    refreshWorkspaces: loadWorkspaces,
  };
}
