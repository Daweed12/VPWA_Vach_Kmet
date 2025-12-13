import { ref } from 'vue';
import { api } from 'boot/api';

export interface TypingUser {
  id: number;
  name: string;
  avatar?: string;
  draftContent?: string;
}

const defaultUserAvatar = new URL('../assets/default_user_avatar.png', import.meta.url).href;

const getFullAvatarUrl = (path: string | null | undefined): string => {
  if (!path) return defaultUserAvatar;
  if (path.startsWith('http')) return path;

  const baseUrl = (api.defaults.baseURL as string) || 'http://localhost:3333';
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};

export function useTyping() {
  const typingUsers = ref<TypingUser[]>([]);
  const typingTimeouts = new Map<number, ReturnType<typeof setTimeout>>();

  const handleTypingUpdate = (
    data: { userId: number; userName: string; userAvatar?: string; draftContent?: string },
    currentUserId?: number | null,
  ) => {
    if (!data.userId || !data.userName) return;
    if (data.userId === currentUserId) return; // Don't show yourself typing

    // Clear existing timeout for this user
    const existingTimeout = typingTimeouts.get(data.userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Add or update typing user with draft content
    const existingUser = typingUsers.value.find((u) => u.id === data.userId);

    // Konvertovať relatívnu cestu na plnú URL
    const fullAvatarUrl = data.userAvatar ? getFullAvatarUrl(data.userAvatar) : defaultUserAvatar;

    if (!existingUser) {
      typingUsers.value.push({
        id: data.userId,
        name: data.userName,
        avatar: fullAvatarUrl,
        draftContent: data.draftContent || '',
      });
    } else {
      // Aktualizovať aj avatar a meno, ak sa zmenili
      existingUser.avatar = fullAvatarUrl;
      if (data.userName) {
        existingUser.name = data.userName;
      }
      existingUser.draftContent = data.draftContent || '';
    }

    // Emit window event for MainLayout (realtime update)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('typingUsersUpdated', {
          detail: { typingUsers: [...typingUsers.value] },
        }),
      );
    }

    // Set timeout to remove typing indicator after 3 seconds
    const timeout = setTimeout(() => {
      typingUsers.value = typingUsers.value.filter((u) => u.id !== data.userId);
      typingTimeouts.delete(data.userId);
      
      // Emit window event after removal
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('typingUsersUpdated', {
            detail: { typingUsers: [...typingUsers.value] },
          }),
        );
      }
    }, 3000);

    typingTimeouts.set(data.userId, timeout);
  };

  const handleTypingStop = (data: { userId: number }) => {
    if (!data.userId) return;

    // Clear timeout
    const timeout = typingTimeouts.get(data.userId);
    if (timeout) {
      clearTimeout(timeout);
      typingTimeouts.delete(data.userId);
    }

    // Remove from typing users
    typingUsers.value = typingUsers.value.filter((u) => u.id !== data.userId);
    
    // Emit window event for MainLayout
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('typingUsersUpdated', {
          detail: { typingUsers: [...typingUsers.value] },
        }),
      );
    }
  };

  const clearTyping = () => {
    typingUsers.value = [];
    typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    typingTimeouts.clear();
    
    // Emit window event for MainLayout
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('typingUsersUpdated', {
          detail: { typingUsers: [] },
        }),
      );
    }
  };

  return {
    typingUsers,
    handleTypingUpdate,
    handleTypingStop,
    clearTyping,
  };
}
