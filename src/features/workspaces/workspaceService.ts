import { supabase } from '../../shared/supabase/client';
import { Workspace, WorkspaceMember } from '../../types';

export const workspaceService = {
  async fetchUserWorkspaces(userId: string): Promise<Workspace[]> {
    const { data: memberships, error: memberError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId);

    if (memberError) throw memberError;
    if (!memberships || memberships.length === 0) return [];

    const workspaceIds = memberships.map((m) => m.workspace_id);

    const { data: workspaces, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .in('id', workspaceIds);

    if (wsError) throw wsError;

    return (workspaces || []).map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      ownerId: w.owner_id,
    }));
  },

  async createWorkspace(name: string, userId: string): Promise<Workspace> {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name,
        slug: `${slug}-${Math.random().toString(36).substring(2, 7)}`,
        owner_id: userId,
      })
      .select()
      .single();

    if (wsError) throw wsError;

    // Add creator as owner member
    const { error: memberError } = await supabase.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: 'owner',
    });

    if (memberError) throw memberError;

    // Create a default general channel
    await supabase.from('channels').insert({
      workspace_id: workspace.id,
      name: 'general',
      topic: 'Default channel for workspace discussions',
      is_private: false,
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      ownerId: workspace.owner_id,
    };
  },

  async fetchWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) throw error;

    return (data || []).map((m) => ({
      workspaceId: m.workspace_id,
      userId: m.user_id,
      role: m.role as 'owner' | 'admin' | 'member',
    }));
  },

  async createInvitation(workspaceId: string, email: string): Promise<{ token: string }> {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const { error } = await supabase.from('invitations').insert({
      workspace_id: workspaceId,
      email,
      token,
      expires_at: expiresAt,
    });

    if (error) throw error;

    return { token };
  },

  async verifyInviteToken(token: string): Promise<{ workspaceId: string; workspaceName: string; email: string } | null> {
    const { data, error } = await supabase
      .from('invitations')
      .select('workspace_id, email, expires_at, workspaces(name)')
      .eq('token', token)
      .single();

    if (error || !data) return null;

    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      return null; // Expired
    }

    const wsData = data.workspaces as unknown as { name: string } | null;

    return {
      workspaceId: data.workspace_id,
      workspaceName: wsData?.name || 'Workspace',
      email: data.email,
    };
  },

  async joinWorkspaceByInvite(token: string, userId: string): Promise<string> {
    const invite = await this.verifyInviteToken(token);
    if (!invite) {
      throw new Error('Invalid or expired invitation token');
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', invite.workspaceId)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      const { error } = await supabase.from('workspace_members').insert({
        workspace_id: invite.workspaceId,
        user_id: userId,
        role: 'member',
      });

      if (error) throw error;
    }

    return invite.workspaceId;
  },
};
