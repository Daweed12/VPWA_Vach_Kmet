import { ref, computed } from 'vue';
import { api } from 'boot/api';

export interface CurrentUser {
  id: number;
  email: string;
  nickname: string;
  firstname: string | null;
  surname: string | null;
  status: string | null;
  profilePicture: string | null;
}

export function useUser() {
  const currentUser = ref<CurrentUser | null>(null);

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

  const currentUserStatus = computed(() => currentUser.value?.status ?? 'online');

  const statusDotClass = computed(() => {
    const status = (currentUser.value?.status ?? 'online').toLowerCase();
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
    }

    if (currentUser.value?.id) {
      try {
        const userRes = await api.get(`/users/${currentUser.value.id}`);
        currentUser.value = userRes.data;
        localStorage.setItem('currentUser', JSON.stringify(userRes.data));
      } catch (error) {
        console.error('Nepodarilo sa obnoviť údaje používateľa:', error);
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
