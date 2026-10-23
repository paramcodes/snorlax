# Domain Model & Authorization Matrix

## Entities
- **User Profile**: id, email, display_name, avatar_url, created_at.
- **Workspace**: id, name, slug, owner_id, created_at.
- **Workspace Member**: workspace_id, user_id, role (owner, admin, member), joined_at.
- **Channel**: id, workspace_id, name, topic, is_private, created_by, created_at.
- **Channel Member**: channel_id, user_id, joined_at.
- **Message**: id, channel_id, user_id, content, parent_id (for threads), edited_at, deleted_at, created_at.
- **Reaction**: id, message_id, user_id, emoji, created_at.
- **Read Marker**: user_id, channel_id, last_read_message_id, updated_at.
- **Invitation**: id, workspace_id, email, token, expires_at, created_at.
- **Attachment**: id, message_id, file_path, file_name, file_size, content_type, created_at.

## Authorization Matrix
| Role / Actor | Workspaces | Channels (Public) | Channels (Private) | Messages | Attachments |
|---|---|---|---|---|---|
| Unauthenticated | None | None | None | None | None |
| Workspace Member | Read own | Read/Join | Read if member | Read/Write | Read/Upload |
| Channel Member | Read own | Read/Write | Read/Write | Read/Write | Read/Upload |
| Workspace Admin | Full manage | Full manage | Full manage | Moderate | Moderate |
