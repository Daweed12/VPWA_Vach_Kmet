<template>
  <q-page class="chat-page">
    <div class="chat-wrapper">
      <div ref="scrollArea" id="chat-scroll" class="chat-scroll">
        <!-- Empty state - no channel selected -->
        <div
          v-if="!activeChannelId"
          class="full-height column items-center justify-center text-grey-7 q-pa-lg"
        >
          <q-icon name="chat_bubble_outline" size="32px" class="q-mb-sm" />
          <div class="text-caption text-center">Najprv vyber kanál vľavo.</div>
        </div>

        <!-- Loading state -->
        <div
          v-else-if="loading && totalMessages === 0"
          class="full-height column items-center justify-center text-grey-7 q-pa-lg"
        >
          <q-spinner-dots size="32px" class="q-mb-sm" />
          <div class="text-caption text-center">Načítavam správy…</div>
        </div>

        <!-- Empty messages state -->
        <div
          v-else-if="!loading && totalMessages === 0"
          class="full-height column items-center justify-center text-grey-7 q-pa-lg"
        >
          <q-icon name="hourglass_empty" size="32px" class="q-mb-sm" />
          <div class="text-caption text-center">Tento kanál zatiaľ nemá žiadne správy.</div>
        </div>


        <!-- Message list -->
        <MessageList
          v-if="activeChannelId && totalMessages > 0"
          :visible-messages="visibleMessages"
          :current-user-nickname="currentUser?.nickname ?? null"
          :infinite-key="infiniteKey"
          :is-loading="isLoading"
          :on-load="handleLoad"
          :channel-id="activeChannelId"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import MessageList from 'src/components/MessageList.vue';
import { useSocket } from 'src/composables/useSocket';
import { useMessages, type CurrentUser } from 'src/composables/useMessages';
import { useTyping } from 'src/composables/useTyping';
import { useSocketEvents } from 'src/composables/useSocketEvents';
import { useInfiniteScroll } from 'src/composables/useInfiniteScroll';
import { useNotifications } from 'src/composables/useNotifications';
import type { MessageFromApi } from 'src/composables/useMessages';
import { api } from 'boot/api';

/* ===== State ===== */
const activeChannelId = ref<number | null>(null);
const activeChannelTitle = ref<string | null>(null);
const currentUser = ref<CurrentUser | null>(null);
// Mapa channelId -> title pre notifikácie
const channelTitleMap = ref<Map<number, string>>(new Map());

/* ===== Composables ===== */
const { socket, initSocket, joinChannel, leaveChannel, disconnectSocket, joinUserRoom } = useSocket();
const {
  rawMessages,
  loading,
  scrollArea,
  uiMessages,
  totalMessages,
  loadMessagesForChannel,
  addMessageOptimistically,
  updateMessageAvatar,
  updateMessageSenderName,
} = useMessages(currentUser);
const { typingUsers, handleTypingUpdate, handleTypingStop, clearTyping } = useTyping();
const {
  visibleCount,
  isLoading,
  infiniteKey,
  resetPaging,
  onLoad: onInfiniteLoad,
  initializeVisibleCount,
} = useInfiniteScroll(totalMessages);
const { showMessageNotification, initialize: initializeNotifications } = useNotifications();

/* ===== Computed ===== */
const visibleMessages = computed(() => {
  const total = totalMessages.value;
  if (total === 0) return [];

  const cnt = Math.min(visibleCount.value || 15, total);
  const start = Math.max(total - cnt, 0);
  return uiMessages.value.slice(start);
});

/* ===== Socket Events Setup ===== */
const setupSocketEvents = () => {
  const socketInstance = socket();
  if (!socketInstance) return;

  useSocketEvents(socketInstance, currentUser, activeChannelId, rawMessages, {
    onUserStatusChanged: () => {
      // Handled by window event
    },
    onUserAvatarChanged: (data) => {
      updateMessageAvatar(data.userId, data.profilePicture);
      // Aktualizovať avatar v typing indikátore
      const typingUser = typingUsers.value.find((u) => u.id === data.userId);
      if (typingUser) {
        const getFullAvatarUrl = (path: string | null | undefined): string => {
          if (!path) {
            const defaultAvatar = new URL('../assets/default_user_avatar.png', import.meta.url).href;
            return defaultAvatar;
          }
          if (path.startsWith('http')) return path;
          const baseUrl = (api.defaults.baseURL as string) || 'http://localhost:3333';
          const cleanBase = baseUrl.replace(/\/$/, '');
          const cleanPath = path.startsWith('/') ? path : `/${path}`;
          return `${cleanBase}${cleanPath}`;
        };
        typingUser.avatar = getFullAvatarUrl(data.profilePicture);
      }
    },
    onUserNicknameChanged: (data) => {
      updateMessageSenderName({
        userId: data.userId,
        nickname: data.nickname,
        firstname: data.firstname,
        surname: data.surname,
        email: data.email ?? undefined,
      });
    },
    onMessage: () => {
      // Scroll to bottom when new message arrives
      setTimeout(() => {
        if (scrollArea.value) {
          scrollArea.value.scrollTop = scrollArea.value.scrollHeight;
        }
      }, 100);
    },
    onNewMessageNotification: (message: MessageFromApi & { channelId?: number; channel_id?: number }) => {
      if (currentUser.value && message.sender.id === currentUser.value.id) {
        return;
      }

      const messageChannelId = message.channelId || message.channel_id;
      if (!messageChannelId) {
        return;
      }

      const channelTitle = channelTitleMap.value.get(messageChannelId) || null;

      showMessageNotification(message, channelTitle, currentUser.value, activeChannelId.value, messageChannelId);
    },
  });

  // Typing indicators
  socketInstance.on(
    'typing:update',
    (data: { userId: number; userName: string; userAvatar?: string; draftContent?: string }) => {
      handleTypingUpdate(data, currentUser.value?.id);
    },
  );

  socketInstance.on('typing:stop', (data: { userId: number }) => {
    handleTypingStop(data);
  });
};

/* ===== Infinite Scroll Handler ===== */
const handleLoad = (index: number, done: (finished?: boolean) => void) => {
  onInfiniteLoad(index, done, scrollArea.value);
};

/* ===== Channel Selection Handler ===== */
const handleChannelSelected = (event: Event) => {
  const detail = (event as CustomEvent<{ id: number; title: string }>).detail;
  const previousChannelId = activeChannelId.value;

  console.log('📺 Channel selected:', detail.id, 'Previous:', previousChannelId);

  clearTyping();

  // Leave previous channel if any
  if (previousChannelId && previousChannelId !== detail.id) {
    leaveChannel(previousChannelId);
  }

  activeChannelId.value = detail.id;
  activeChannelTitle.value = detail.title;

  // Aktualizovať mapu kanálov pre notifikácie
  channelTitleMap.value.set(detail.id, detail.title);
  console.log('📋 Channel title map updated:', {
    channelId: detail.id,
    channelTitle: detail.title,
    mapSize: channelTitleMap.value.size,
  });

  // Len ak používateľ nie je offline, pripojiť WebSocket a načítať správy
  if (currentUser.value?.connection !== 'offline') {
    // Ensure socket is initialized and connected
    if (!socket()) {
      console.warn('Socket not initialized, initializing now...');
      initSocket();
      setupSocketEvents();
    }

    // Join new channel (will wait for connection if needed)
    joinChannel(detail.id);
  } else {
    console.log('User is offline, not joining channel or loading messages via WebSocket');
  }

  // Vždy načítať správy z DB (aj keď je offline)

  void loadMessagesForChannel(detail.id);
  resetPaging();
  initializeVisibleCount(15);
};

/* ===== Current User Update Handler ===== */
const handleCurrentUserUpdated = (event: Event) => {
  const detail = (event as CustomEvent<CurrentUser>).detail;
  const oldConnection = currentUser.value?.connection;
  currentUser.value = detail;

  // Ak sa zmenil connection z online na offline, odpojiť WebSocket
  if (oldConnection !== 'offline' && detail.connection === 'offline') {
    console.log('User went offline, disconnecting WebSocket');
    disconnectSocket();
  }

  // Ak sa zmenil connection z offline na online, pripojiť WebSocket a načítať správy
  if (oldConnection === 'offline' && detail.connection !== 'offline') {
    console.log('User went online, connecting WebSocket and loading messages');
    initSocket();
    setupSocketEvents();

    const socketInstance = socket();
    if (socketInstance) {
      if (socketInstance.connected) {
        // Join user room
        if (currentUser.value?.id) {
          joinUserRoom(currentUser.value.id);
        }
        if (activeChannelId.value) {
          joinChannel(activeChannelId.value);
          void loadMessagesForChannel(activeChannelId.value);
        }
      } else {
        socketInstance.once('connect', () => {
          setupSocketEvents();
          // Join user room
          if (currentUser.value?.id) {
            joinUserRoom(currentUser.value.id);
          }
          if (activeChannelId.value) {
            joinChannel(activeChannelId.value);
            void loadMessagesForChannel(activeChannelId.value);
          }
        });
      }
    }
  }
};

/* ===== User Avatar Changed Handler ===== */
const handleUserAvatarChanged = (event: Event) => {
  const customEvent = event as CustomEvent<{
    userId: number;
    profilePicture: string;
    name: string;
  }>;
  const { userId, profilePicture } = customEvent.detail;

  updateMessageAvatar(userId, profilePicture);

  if (currentUser.value && currentUser.value.id === userId) {
    const cleanPath = profilePicture.split('?')[0];
    currentUser.value.profilePicture = cleanPath || null;
    localStorage.setItem('currentUser', JSON.stringify(currentUser.value));
  }
};

/* ===== User Nickname Changed Handler ===== */
const handleUserNicknameChanged = (event: Event) => {
  const customEvent = event as CustomEvent<{
    userId: number;
    nickname?: string | null;
    firstname?: string | null;
    surname?: string | null;
    email?: string | null;
    name: string;
  }>;
  const { userId, nickname, firstname, surname, email } = customEvent.detail;

  updateMessageSenderName({ userId, nickname, firstname, surname, email });

  // Update current user locally if it is the same user
  if (currentUser.value && currentUser.value.id === userId) {
    if (nickname !== undefined) currentUser.value.nickname = nickname ?? currentUser.value.nickname;
    if (firstname !== undefined) currentUser.value.firstname = firstname ?? currentUser.value.firstname;
    if (surname !== undefined) currentUser.value.surname = surname ?? currentUser.value.surname;
    if (email) currentUser.value.email = email;
    localStorage.setItem('currentUser', JSON.stringify(currentUser.value));
  }
};

/* ===== Expose functions to window ===== */
declare global {
  interface Window {
    addMessageToChat: (content: string) => number | null;
    emitTyping: (isTyping: boolean, draftContent?: string) => void;
  }
}

if (typeof window !== 'undefined') {
  window.addMessageToChat = (content: string): number | null => {
    if (!activeChannelId.value || !currentUser.value) return null;
    return addMessageOptimistically(content);
  };

  window.emitTyping = (isTyping: boolean, draftContent?: string) => {
    const socketInstance = socket();
    if (!socketInstance?.connected || !activeChannelId.value || !currentUser.value) return;

    const userName =
      currentUser.value.firstname && currentUser.value.surname
        ? `${currentUser.value.firstname} ${currentUser.value.surname}`
        : currentUser.value.nickname || currentUser.value.email;

    // Použiť getFullAvatarUrl na konverziu relatívnej cesty na plnú URL
    const getFullAvatarUrl = (path: string | null | undefined): string => {
      if (!path) {
        const defaultAvatar = new URL('../assets/default_user_avatar.png', import.meta.url).href;
        return defaultAvatar;
      }
      if (path.startsWith('http')) return path;

      const baseUrl = (api.defaults.baseURL as string) || 'http://localhost:3333';
      const cleanBase = baseUrl.replace(/\/$/, '');
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${cleanBase}${cleanPath}`;
    };

    if (isTyping) {
      socketInstance.emit('typing:update', {
        channelId: activeChannelId.value,
        userId: currentUser.value.id,
        userName: userName,
        userAvatar: getFullAvatarUrl(currentUser.value.profilePicture),
        draftContent: draftContent || '',
      });
    } else {
      socketInstance.emit('typing:stop', {
        channelId: activeChannelId.value,
        userId: currentUser.value.id,
      });
    }
  };
}

/* ===== Channel Title Map Handler ===== */
const handleChannelCreated = (event: Event) => {
  const customEvent = event as CustomEvent<{
    id: number;
    title: string;
    availability: string;
    creatorId: number;
    createdAt: string;
    userId?: number;
  }>;
  if (customEvent.detail) {
    channelTitleMap.value.set(customEvent.detail.id, customEvent.detail.title);
  }
};

const handleChannelJoined = (event: Event) => {
  const customEvent = event as CustomEvent<{
    channelId: number;
    userId: number;
    channel: {
      id: number;
      title: string;
      availability: string;
      creatorId: number;
      createdAt: string;
    };
  }>;
  if (customEvent.detail?.channel) {
    channelTitleMap.value.set(customEvent.detail.channel.id, customEvent.detail.channel.title);
  }
};

/* ===== Lifecycle ===== */
onMounted(() => {
  const stored = localStorage.getItem('currentUser');
  if (stored) currentUser.value = JSON.parse(stored);

  // Initialize socket.io connection len ak používateľ nie je offline
  if (currentUser.value?.connection !== 'offline') {
    initSocket();
    setupSocketEvents();
    const socketInstance = socket();
    if (socketInstance) {
      if (socketInstance.connected) {
        console.log('Socket already connected on mount');
        // Join user room
        if (currentUser.value?.id) {
          joinUserRoom(currentUser.value.id);
        }
        if (activeChannelId.value) {
          joinChannel(activeChannelId.value);
        }
      } else {
        console.log('⏳ Waiting for socket connection...');
        socketInstance.once('connect', () => {
          console.log('Socket connected after mount, joining channel if needed');
          setupSocketEvents();
          // Join user room
          if (currentUser.value?.id) {
            joinUserRoom(currentUser.value.id);
          }
          if (activeChannelId.value) {
            joinChannel(activeChannelId.value);
          }
        });
      }

      socketInstance.on('reconnect', () => {
        // Reconnect len ak používateľ nie je offline
        if (currentUser.value?.connection !== 'offline') {
          console.log('🔄 Socket reconnected, rejoining channel if needed');
          if (activeChannelId.value) {
            joinChannel(activeChannelId.value);
          }
          if (currentUser.value?.id) {
            joinUserRoom(currentUser.value.id);
          }
        } else {
          // Ak je offline, odpojiť socket znova
          console.log('User is offline, disconnecting reconnected socket');
          disconnectSocket();
        }
      });
    } else {
      console.error('Failed to initialize socket');
    }
  }

  window.addEventListener('channelSelected', handleChannelSelected as EventListener);
  window.addEventListener('currentUserUpdated', handleCurrentUserUpdated as EventListener);
  window.addEventListener('userAvatarChanged', handleUserAvatarChanged as EventListener);
  window.addEventListener('userNicknameChanged', handleUserNicknameChanged as EventListener);
  window.addEventListener('channelCreated', handleChannelCreated as EventListener);
  window.addEventListener('channelJoined', handleChannelJoined as EventListener);

  // Inicializovať notifikácie
  initializeNotifications();
});

onUnmounted(() => {
  disconnectSocket();

  window.removeEventListener('channelSelected', handleChannelSelected as EventListener);
  window.removeEventListener('currentUserUpdated', handleCurrentUserUpdated as EventListener);
  window.removeEventListener('userAvatarChanged', handleUserAvatarChanged as EventListener);
  window.removeEventListener('userNicknameChanged', handleUserNicknameChanged as EventListener);
  window.removeEventListener('channelCreated', handleChannelCreated as EventListener);
  window.removeEventListener('channelJoined', handleChannelJoined as EventListener);
});
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #ffcc80;
}

.chat-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 1px;
}

.chat-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.chat-scroll::-webkit-scrollbar {
  display: none;
}

.chat-scroll {
  scrollbar-width: none;
}
</style>
