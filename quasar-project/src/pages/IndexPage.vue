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

        <!-- Typing indicator -->
        <TypingIndicator :typing-users="typingUsers" />

        <!-- Message list -->
        <MessageList
          v-if="activeChannelId && totalMessages > 0"
          :visible-messages="visibleMessages"
          :current-user-nickname="currentUser?.nickname ?? null"
          :infinite-key="infiniteKey"
          :is-loading="isLoading"
          :on-load="handleLoad"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import TypingIndicator from 'src/components/TypingIndicator.vue';
import MessageList from 'src/components/MessageList.vue';
import { useSocket } from 'src/composables/useSocket';
import { useMessages, type CurrentUser } from 'src/composables/useMessages';
import { useTyping } from 'src/composables/useTyping';
import { useSocketEvents } from 'src/composables/useSocketEvents';
import { useInfiniteScroll } from 'src/composables/useInfiniteScroll';

/* ===== State ===== */
const activeChannelId = ref<number | null>(null);
const activeChannelTitle = ref<string | null>(null);
const currentUser = ref<CurrentUser | null>(null);

/* ===== Composables ===== */
const { socket, initSocket, joinChannel, leaveChannel, disconnectSocket } = useSocket();
const {
  rawMessages,
  loading,
  scrollArea,
  uiMessages,
  totalMessages,
  loadMessagesForChannel,
  addMessageOptimistically,
  updateMessageAvatar,
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
    },
    onMessage: () => {
      // Scroll to bottom when new message arrives
      setTimeout(() => {
        if (scrollArea.value) {
          scrollArea.value.scrollTop = scrollArea.value.scrollHeight;
        }
      }, 100);
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

  // Ensure socket is initialized and connected
  if (!socket()) {
    console.warn('⚠️ Socket not initialized, initializing now...');
    initSocket();
    setupSocketEvents();
  }

  // Join new channel (will wait for connection if needed)
  joinChannel(detail.id);

  void loadMessagesForChannel(detail.id);
  resetPaging();
  initializeVisibleCount(15);
};

/* ===== Current User Update Handler ===== */
const handleCurrentUserUpdated = (event: Event) => {
  const detail = (event as CustomEvent<CurrentUser>).detail;
  currentUser.value = detail;
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

    if (isTyping) {
      socketInstance.emit('typing:update', {
        channelId: activeChannelId.value,
        userId: currentUser.value.id,
        userName: userName,
        userAvatar: currentUser.value.profilePicture,
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

/* ===== Notifications ===== */
const notificationsSupported = typeof window !== 'undefined' && typeof Notification !== 'undefined';
const notificationPermission = ref<NotificationPermission>(
  notificationsSupported ? Notification.permission : 'default',
);

let notificationTimer: ReturnType<typeof setTimeout> | null = null;

const showNotification = () => {
  if (!notificationsSupported) return;
  if (notificationPermission.value !== 'granted') return;

  const last = uiMessages.value[uiMessages.value.length - 1];
  if (!last) return;

  const notification = new Notification(last.name, {
    body: last.text,
    icon: last.avatar,
    badge: 'https://cdn-icons-png.flaticon.com/512/1384/1384069.png',
  });
  notification.onclick = () => {
    window.focus();
  };
};

const handleVisibilityChange = () => {
  if (!notificationsSupported) return;

  if (document.visibilityState === 'hidden') {
    notificationTimer = setTimeout(() => {
      showNotification();
    }, 3000);
  } else if (notificationTimer) {
    clearTimeout(notificationTimer);
    notificationTimer = null;
  }
};

/* ===== Lifecycle ===== */
onMounted(() => {
  const stored = localStorage.getItem('currentUser');
  if (stored) currentUser.value = JSON.parse(stored);

  // Initialize socket.io connection immediately
  initSocket();
  setupSocketEvents();

  // Ensure socket connects and joins channel when ready
  const socketInstance = socket();
  if (socketInstance) {
    if (socketInstance.connected) {
      console.log('✅ Socket already connected on mount');
      if (activeChannelId.value) {
        joinChannel(activeChannelId.value);
      }
    } else {
      console.log('⏳ Waiting for socket connection...');
      socketInstance.once('connect', () => {
        console.log('✅ Socket connected after mount, joining channel if needed');
        setupSocketEvents();
        if (activeChannelId.value) {
          joinChannel(activeChannelId.value);
        }
      });
    }

    socketInstance.on('reconnect', () => {
      console.log('🔄 Socket reconnected, rejoining channel if needed');
      if (activeChannelId.value) {
        joinChannel(activeChannelId.value);
      }
    });
  } else {
    console.error('❌ Failed to initialize socket');
  }

  window.addEventListener('channelSelected', handleChannelSelected as EventListener);
  window.addEventListener('currentUserUpdated', handleCurrentUserUpdated as EventListener);
  window.addEventListener('userAvatarChanged', handleUserAvatarChanged as EventListener);

  if (notificationsSupported) {
    notificationPermission.value = Notification.permission;
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission()
        .then((permission) => {
          notificationPermission.value = permission;
        })
        .catch((err) => {
          console.error('Chyba pri žiadaní o povolenie na notifikácie:', err);
        });
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
});

onUnmounted(() => {
  disconnectSocket();

  window.removeEventListener('channelSelected', handleChannelSelected as EventListener);
  window.removeEventListener('currentUserUpdated', handleCurrentUserUpdated as EventListener);
  window.removeEventListener('userAvatarChanged', handleUserAvatarChanged as EventListener);

  if (notificationsSupported) {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }
  if (notificationTimer) {
    clearTimeout(notificationTimer);
    notificationTimer = null;
  }
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
