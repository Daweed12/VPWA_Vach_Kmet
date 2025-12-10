import { ref, computed, nextTick } from 'vue';
import { api } from 'boot/api';

export interface SenderFromApi {
  id: number;
  nickname: string;
  firstname: string | null;
  surname: string | null;
  email: string;
  profilePicture: string | null;
}

export interface MessageFromApi {
  id: number;
  content: string;
  timestamp: string;
  sender: SenderFromApi;
}

export interface UiMessage {
  id: number;
  name: string;
  avatar: string;
  sent: boolean;
  text: string;
  stamp: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  nickname: string;
  firstname: string | null;
  surname: string | null;
  status: string | null;
  connection?: string | null;
  profilePicture?: string | null;
}

const defaultUserAvatar = new URL('../assets/default_user_avatar.png', import.meta.url).href;

export function useMessages(currentUser: { value: CurrentUser | null }) {
  const rawMessages = ref<MessageFromApi[]>([]);
  const loading = ref(false);
  const scrollArea = ref<HTMLElement | null>(null);

  const getFullAvatarUrl = (path: string | null | undefined) => {
    if (!path) return defaultUserAvatar;
    if (path.startsWith('http')) return path;

    const baseUrl = (api.defaults.baseURL as string) || 'http://localhost:3333';
    const cleanBase = baseUrl.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${cleanBase}${cleanPath}`;
  };

  const uiMessages = computed<UiMessage[]>(() => {
    return rawMessages.value
      .filter((m) => m.sender)
      .map((m) => {
        const s = m.sender;

        const displayName =
          s.nickname || `${s.firstname ?? ''} ${s.surname ?? ''}`.trim() || s.email;

        const meId = currentUser.value?.id ?? null;
        const isMe = meId !== null && s.id === meId;

        const stamp = new Date(m.timestamp).toLocaleString('sk-SK', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });

        const avatar = getFullAvatarUrl(s.profilePicture);

        return {
          id: m.id,
          name: displayName,
          avatar,
          sent: isMe,
          text: m.content,
          stamp,
        };
      });
  });

  const totalMessages = computed(() => uiMessages.value.length);

  const loadMessagesForChannel = async (channelId: number | null) => {
    if (!channelId) {
      rawMessages.value = [];
      return;
    }

    loading.value = true;

    try {
      const { data } = await api.get<MessageFromApi[]>(`/channels/${channelId}/messages`);
      console.log('Loaded messages from API:', data);
      rawMessages.value = data || [];

      await nextTick();
      if (scrollArea.value) {
        scrollArea.value.scrollTop = scrollArea.value.scrollHeight;
      }
    } catch (error) {
      console.error('Chyba pri načítaní správ z API', error);
      rawMessages.value = [];
    } finally {
      loading.value = false;
    }
  };

  const addMessageOptimistically = (content: string): number => {
    if (!currentUser.value) {
      return -1;
    }

    const optimisticMessage: MessageFromApi = {
      id: -Date.now(),
      content: content,
      timestamp: new Date().toISOString(),
      sender: {
        id: currentUser.value.id,
        nickname: currentUser.value.nickname,
        firstname: currentUser.value.firstname,
        surname: currentUser.value.surname,
        email: currentUser.value.email,
        profilePicture: currentUser.value.profilePicture || null,
      },
    };

    rawMessages.value.push(optimisticMessage);

    void nextTick(() => {
      if (scrollArea.value) {
        scrollArea.value.scrollTop = scrollArea.value.scrollHeight;
      }
    });

    return optimisticMessage.id;
  };

  const updateMessageAvatar = (userId: number, profilePicture: string) => {
    const timestamp = Date.now();
    rawMessages.value.forEach((msg) => {
      if (msg.sender && msg.sender.id === userId) {
        const cleanPath = profilePicture.split('?')[0];
        msg.sender.profilePicture = `${cleanPath}?t=${timestamp}`;
      }
    });
  };

  return {
    rawMessages,
    loading,
    scrollArea,
    uiMessages,
    totalMessages,
    loadMessagesForChannel,
    addMessageOptimistically,
    updateMessageAvatar,
    getFullAvatarUrl,
  };
}
