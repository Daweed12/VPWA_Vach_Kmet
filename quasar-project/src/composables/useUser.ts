import { ref, computed, watch } from 'vue';
import { api } from 'boot/api';
import { useSocket } from './useSocket';

export interface CurrentUser {
  id: number;
  email: string;
  nickname: string;
  firstname: string | null;
  surname: string | null;
  status: string | null;
  connection?: string | null;
  profilePicture: string | null;
  notifyOnMentionOnly?: boolean;
}

const currentUser = ref<CurrentUser | null>(null);

export function useUser() {
  const { initSocket, disconnectSocket, joinUserRoom } = useSocket();

  watch(
    () => currentUser.value?.connection,
    (newConnection, oldConnection) => {
      if (newConnection === 'offline') {
        disconnectSocket();
      } else if (newConnection === 'online' && oldConnection === 'offline') {
        initSocket();
        if (currentUser.value?.id) {
          joinUserRoom(currentUser.value.id);
        }
      }
    }
  );

  const currentUserName = computed(() => {
    if (!currentUser.value) return 'User';
    if (currentUser.value.nickname && currentUser.value.nickname.trim() !== '') {
      return currentUser.value.nickname;
    }
    const fullName =
      `${currentUser.value.firstname ?? ''} ${currentUser.value.surname ?? ''}`.trim();
    if (fullName) return fullName;
    return currentUser.value.email;
  });

  const currentUserAvatar = computed(() => {
    const pic = currentUser.value?.profilePicture;
    if (!pic) return 'https://cdn.quasar.dev/img/avatar4.jpg';
    if (pic.startsWith('http')) return pic;

    const baseUrl = (api.defaults.baseURL as string) || 'http://localhost:3333';
    const cleanBase = baseUrl.replace(/\/$/, '');
    const cleanPath = pic.startsWith('/') ? pic : `/${pic}`;

    return `${cleanBase}${cleanPath}`;
  });

  const currentUserStatus = computed(() => {
    if (!currentUser.value) return 'online';
    if (currentUser.value.connection === 'offline') {
      return 'offline';
    }
    const status = currentUser.value.status?.toLowerCase() ?? 'normal';
    return status === 'normal' ? 'online' : status;
  });

  const statusDotClass = computed(() => {
    const status = currentUserStatus.value.toLowerCase();
    return {
      'bg-green': status === 'online',
      'bg-amber': status === 'away',
      'bg-red': status === 'dnd',
      'bg-grey': status === 'offline',
    };
  });

  const loadUser = async () => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      currentUser.value = JSON.parse(stored);
      if (currentUser.value?.connection === 'offline') {
        disconnectSocket();
      }
    }

    if (currentUser.value?.id) {
      try {
        const userRes = await api.get(`/users/${currentUser.value.id}`);
        const freshUser = userRes.data;
        currentUser.value = freshUser;
        localStorage.setItem('currentUser', JSON.stringify(freshUser));

        if (freshUser.connection === 'offline') {
          disconnectSocket();
        } else {
          initSocket();
          joinUserRoom(freshUser.id);
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  return {
    currentUser,
    currentUserName,
    currentUserAvatar,
    currentUserStatus,
    statusDotClass,
    loadUser,
  };
}
