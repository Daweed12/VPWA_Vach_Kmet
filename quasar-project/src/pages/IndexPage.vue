<template>
  <q-page class="chat-page">
    <div class="chat-wrapper">






      <!-- samotný chat -->
      <div
        ref="scrollArea"
        id="chat-scroll"
        class="chat-scroll"
      >
        <!-- 1) Nie je zvolený žiadny kanál -->
        <div
          v-if="!activeChannelId"
          class="full-height column items-center justify-center text-grey-7 q-pa-lg"
        >
          <q-icon name="chat_bubble_outline" size="32px" class="q-mb-sm" />
          <div class="text-caption text-center">
            Najprv vyber kanál vľavo.
          </div>
        </div>

        <!-- 2) Načítanie prvých správ -->
        <div
          v-else-if="loading && totalMessages === 0"
          class="full-height column items-center justify-center text-grey-7 q-pa-lg"
        >
          <q-spinner-dots size="32px" class="q-mb-sm" />
          <div class="text-caption text-center">
            Načítavam správy…
          </div>
        </div>

        <!-- 3) Kanál je prázdny -->
        <div
          v-else-if="!loading && totalMessages === 0"
          class="full-height column items-center justify-center text-grey-7 q-pa-lg"
        >
          <q-icon name="hourglass_empty" size="32px" class="q-mb-sm" />
          <div class="text-caption text-center">
            Tento kanál zatiaľ nemá žiadne správy.
          </div>
        </div>

        <!-- Typing indicator with draft preview - bottom left corner -->
        <div
          v-if="typingUsers.length > 0"
          class="typing-indicator-fixed"
        >
          <q-card class="typing-card">
            <q-card-section class="q-pa-sm">
              <div
                v-for="user in typingUsers"
                :key="user.id"
                class="typing-user-item"
              >
                <div class="row items-center q-mb-xs">
                  <q-icon name="edit" size="14px" class="q-mr-xs text-grey-7" />
                  <span class="text-caption text-weight-medium text-grey-8">
                    {{ user.name }}
                  </span>
                </div>
                <div
                  v-if="user.draftContent"
                  class="draft-content text-body2 text-grey-7 q-pl-md"
                >
                  "{{ user.draftContent }}"
                </div>
                <div
                  v-else
                  class="typing-dots q-pl-md"
                >
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- 4) Správy + infinite scroll -->
        <div
          class="q-pt-sm q-pb-lg"
        >
          <q-infinite-scroll
            :key="infiniteKey"
            reverse
            :offset="10"
            :debounce="120"
            @load="onLoad"
            scroll-target="#chat-scroll"
          >
            <div
              v-for="msg in visibleMessages"
              :key="msg.id"
              :class="['q-px-sm q-py-xs', isMentioned(msg) ? 'mention-highlight' : '']"
            >
              <q-chat-message
                :name="msg.name"
                :stamp="msg.stamp"
                :sent="msg.sent"
                :bg-color="msg.sent ? 'primary' : 'grey-3'"
                :text-color="msg.sent ? 'white' : 'black'"
                class="shadow-sm"
              >
                <!-- vlastný avatar s ikonkou -->
                <template #avatar>
                  <q-avatar
                    size="38px"
                    :class="['msg-avatar', msg.sent ? 'msg-avatar--sent' : 'msg-avatar--received']"
                  >
                    <img :src="msg.avatar" style="object-fit: cover;" />
                  </q-avatar>
                </template>

                <template #default>
    <span class="bubble-text">
      <span
        v-for="(chunk, idx) in chunks(msg.text)"
        :key="msg.id + '-' + idx"
      >
        <span
          v-if="chunk.type === 'mention'"
          class="mention"
        >
          @{{ chunk.value }}
        </span>
        <span v-else>{{ chunk.value }}</span>
      </span>
    </span>
                </template>
              </q-chat-message>
            </div>

            <template #loading>
              <div class="loading-banner" v-show="isLoading">
                <q-spinner-dots size="24px" />
                <span class="ml-2">Načítavam staršie správy…</span>
              </div>
            </template>
          </q-infinite-scroll>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { api } from 'boot/api'
import { io, type Socket } from 'socket.io-client'
const defaultUserAvatar = new URL('../assets/0_DEFAULT_USER.png.png', import.meta.url).href


// Window interface will be extended later

/* ===== typy z API ===== */
interface MessageWithMentions extends MessageFromApi {
  mentions?: { id: number; nickname: string }[]
}

interface CurrentUser {
  id: number
  email: string
  nickname: string
  firstname: string | null
  surname: string | null
  status: string | null
  profilePicture?: string | null
}

interface SenderFromApi {
  id: number
  nickname: string
  firstname: string | null
  surname: string | null
  email: string
  profilePicture: string | null
}

interface MessageFromApi {
  id: number
  content: string
  timestamp: string
  sender: SenderFromApi
}

type Chunk = { type: 'text' | 'mention'; value: string }

interface UiMessage {
  id: number
  name: string        // bude nickname
  avatar: string
  sent: boolean
  text: string
  stamp: string       // formátovaný čas
}


/* ===== stav stránky ===== */

const activeChannelId = ref<number | null>(null)
const activeChannelTitle = ref<string | null>(null)

const currentUser = ref<CurrentUser | null>(null)

const rawMessages = ref<MessageFromApi[]>([])
const loading = ref(false)

const scrollArea = ref<HTMLElement | null>(null)

const isMentioned = (msg: UiMessage & { mentions?: { id: number }[] }) => {
  if (!currentUser.value) return false
  if (!('mentions' in msg)) return false
  if (!msg.mentions || msg.mentions.length === 0) return false

  return msg.mentions.some(u => u.id === currentUser.value!.id)
}


const getFullAvatarUrl = (path: string | null | undefined) => {
  if (!path) return defaultUserAvatar // Ak nemá fotku, vráti lokálny default
  if (path.startsWith('http')) return path // Ak je to externá linka (napr. google), vráť ju

  // Získaj base URL z API konfigurácie (napr. http://localhost:3333)
  const baseUrl = (api.defaults.baseURL as string) || 'http://localhost:3333'

  // Odstránime koncovú lomku z baseUrl a začiatočnú z path, aby sme nemali //
  const cleanBase = baseUrl.replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  return `${cleanBase}${cleanPath}`
}

// Typing indicators with draft content
interface TypingUser {
  id: number
  name: string
  avatar?: string
  draftContent?: string
}

const typingUsers = ref<TypingUser[]>([])
const typingTimeouts = new Map<number, ReturnType<typeof setTimeout>>()

/* ===== socket.io connection ===== */

let socket: Socket | null = null

const initSocket = () => {
  // Don't recreate if already exists and connected
  if (socket) {
    if (socket.connected) {
      console.log('Socket already connected')
      return
    }
    // If socket exists but not connected, disconnect and recreate
    socket.disconnect()
    socket = null
  }

  console.log('🔌 Initializing Socket.IO connection to http://localhost:3333...')

  // Get API base URL from the api instance
  const apiBaseUrl = (api.defaults.baseURL as string) || 'http://localhost:3333'
  const socketUrl = apiBaseUrl.replace(/\/$/, '') // Remove trailing slash

  console.log('🔗 Connecting to:', socketUrl)

  socket = io(socketUrl, {
    transports: ['polling', 'websocket'], // Try polling first, then websocket
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
    timeout: 20000,
    forceNew: false,
    autoConnect: true,
    upgrade: true, // Allow upgrade from polling to websocket
    rememberUpgrade: false
  })

  socket.on('connect', () => {
    console.log('✅ Socket.IO connected:', socket?.id, 'Total connected clients should be visible on server')
    // Rejoin current channel if one is selected
    if (activeChannelId.value) {
      console.log('🔄 Rejoining channel after connection:', activeChannelId.value)
      joinChannel(activeChannelId.value)
    }
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket.IO disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error)
  })

  // Typing indicators with draft content
  socket.on('typing:update', (data: { userId: number; userName: string; userAvatar?: string; draftContent?: string }) => {
    if (!data.userId || !data.userName) return
    if (data.userId === currentUser.value?.id) return // Don't show yourself typing

    // Clear existing timeout for this user
    const existingTimeout = typingTimeouts.get(data.userId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Add or update typing user with draft content
    const existingUser = typingUsers.value.find(u => u.id === data.userId)

    if (!existingUser) {
      typingUsers.value.push({
        id: data.userId,
        name: data.userName,
        avatar: data.userAvatar || defaultUserAvatar,
        draftContent: data.draftContent || ''
      })
    } else {
      existingUser.draftContent = data.draftContent || ''
    }
    // Set timeout to remove typing indicator after 3 seconds
    const timeout = setTimeout(() => {
      typingUsers.value = typingUsers.value.filter(u => u.id !== data.userId)
      typingTimeouts.delete(data.userId)
    }, 3000)

    typingTimeouts.set(data.userId, timeout)
  })

  socket.on('typing:stop', (data: { userId: number }) => {
    if (!data.userId) return

    // Clear timeout
    const timeout = typingTimeouts.get(data.userId)
    if (timeout) {
      clearTimeout(timeout)
      typingTimeouts.delete(data.userId)
    }

    // Remove from typing users
    typingUsers.value = typingUsers.value.filter(u => u.id !== data.userId)
  })

  socket.on('chat:message', (data: unknown) => {
    console.log('🔵🔵🔵 RECEIVED chat:message event:', data)
    console.log('🔵 Current user ID:', currentUser.value?.id, 'Active channel ID:', activeChannelId.value)
    console.log('🔵 Socket connected?', socket?.connected, 'Socket ID:', socket?.id)

    const message = data as MessageFromApi & { channelId?: number; channel_id?: number }

    // Validate message structure
    if (!message.sender) {
      console.warn('⚠️ Received message without sender:', message)
      return
    }

    if (!message.content) {
      console.warn('⚠️ Received message without content:', message)
      return
    }

    // Get channel ID from message
    const messageChannelId = message.channelId || message.channel_id

    if (!messageChannelId) {
      console.warn('⚠️ Received message without channelId:', message)
      return
    }

    console.log(`📨 Message details:`, {
      messageId: message.id,
      channelId: messageChannelId,
      activeChannelId: activeChannelId.value,
      senderId: message.sender.id,
      currentUserId: currentUser.value?.id,
      isFromCurrentUser: currentUser.value?.id === message.sender.id,
      content: message.content.substring(0, 50) + '...'
    })

    // If we have an active channel, only show messages for that channel
    // BUT: if no channel is active, we should still show it (for cases where user just opened the app)
    if (activeChannelId.value !== null && messageChannelId !== activeChannelId.value) {
      console.log(`ℹ️ Ignoring message - active channel (${activeChannelId.value}) != message channel (${messageChannelId})`)
      return
    }

    console.log('✅ Message passed channel filter, processing...')

    // Check if this is from current user - might be replacing optimistic message
    const isFromCurrentUser = currentUser.value && message.sender.id === currentUser.value.id
    if (isFromCurrentUser) {
      // Try to find and replace optimistic message (negative ID)
      const optimisticIndex = rawMessages.value.findIndex(m => m.id < 0 && m.content === message.content)
      if (optimisticIndex !== -1) {
        console.log('✅ Replacing optimistic message with real one')
        rawMessages.value[optimisticIndex] = message

        // Aktualizuj visibleCount ak je potrebné
        const total = rawMessages.value.length
        if (visibleCount.value < total) {
          visibleCount.value = Math.min(visibleCount.value + 1, total)
        }

        void nextTick(() => {
          if (scrollArea.value) {
            scrollArea.value.scrollTop = scrollArea.value.scrollHeight
          }
        })
        return
      }
    }

    // Check if message already exists (avoid duplicates)
    const exists = rawMessages.value.some(m => m.id === message.id && m.id > 0)
    if (exists) {
      console.log('ℹ️ Message already exists, skipping (duplicate)')
      return
    }

    console.log('✅ Adding new message to chat (from another user)')
    // Add the message
    rawMessages.value.push(message)

    // Aktualizuj visibleCount ak je potrebné
    const total = rawMessages.value.length
    if (visibleCount.value < total) {
      visibleCount.value = Math.min(visibleCount.value + 1, total)
    }

    // Scroll to bottom
    void nextTick(() => {
      if (scrollArea.value) {
        scrollArea.value.scrollTop = scrollArea.value.scrollHeight
      }
    })
  })
}

const joinChannel = (channelId: number) => {
  if (!socket) {
    console.warn('⚠️ Socket not initialized, initializing now...')
    initSocket()
    // Wait a bit for socket to initialize, then try again
    setTimeout(() => {
      if (socket?.connected) {
        socket.emit('channel:join', channelId)
        console.log('✅ Joined channel after initialization:', channelId)
      } else {
        socket?.once('connect', () => {
          socket?.emit('channel:join', channelId)
          console.log('✅ Joined channel after delayed connection:', channelId)
        })
      }
    }, 100)
    return
  }

  if (!socket.connected) {
    console.warn('⚠️ Socket not connected, will join when connected. Channel:', channelId)
    // Wait for connection and then join
    const connectHandler = () => {
      socket?.emit('channel:join', channelId)
      console.log('✅ Joined channel after reconnection:', channelId)
      socket?.off('connect', connectHandler) // Remove listener to avoid duplicates
    }
    socket.once('connect', connectHandler)
    return
  }

  socket.emit('channel:join', channelId)
  console.log('✅ Emitted channel:join for channel:', channelId)
}

const leaveChannel = (channelId: number) => {
  if (!socket?.connected) {
    return
  }
  socket.emit('channel:leave', channelId)
  console.log('Left channel:', channelId)
}

const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/* ===== infinite scroll paging ===== */

const step = 15                           // koľko správ naraz
const visibleCount = ref(0)               // koľko správ je aktuálne vidno
const isLoading = ref(false)              // loading banner hore
const finished = ref(false)               // či už nie sú ďalšie správy

// 👉 nový kľúč pre q-infinite-scroll
const infiniteKey = ref(0)

/* ===== odvodené hodnoty ===== */

const uiMessages = computed(() => {
  return rawMessages.value
    .filter((m) => m.sender)
    .map((m) => {
      const s = m.sender

      const displayName =
        s.nickname ||
        `${s.firstname ?? ''} ${s.surname ?? ''}`.trim() ||
        s.email

      const meId = currentUser.value?.id ?? null
      const isMe = meId !== null && s.id === meId

      const stamp = new Date(m.timestamp).toLocaleString('sk-SK', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })

      return {
        id: m.id,
        name: displayName,
        avatar: getFullAvatarUrl(s.profilePicture),
        sent: isMe,
        text: m.content,
        stamp,
        mentions: (m as MessageWithMentions).mentions ?? []
      }
    })
})




const totalMessages = computed(() => uiMessages.value.length)

const visibleMessages = computed<UiMessage[]>(() => {
  const total = totalMessages.value
  if (total === 0) return []

  const cnt = Math.min(visibleCount.value || step, total)
  const start = Math.max(total - cnt, 0)
  return uiMessages.value.slice(start)
})

/* ===== helpery ===== */

const resetPaging = () => {
  visibleCount.value = 0
  isLoading.value = false
  finished.value = false
}

/* ===== načítanie správ pre kanál ===== */

const loadMessagesForChannel = async () => {
  if (!activeChannelId.value) {
    rawMessages.value = []
    return
  }

  loading.value = true
  resetPaging()

  infiniteKey.value++

  try {
    const { data } = await api.get<MessageFromApi[]>(
      `/channels/${activeChannelId.value}/messages`,
    )
    console.log('Loaded messages from API:', data)
    rawMessages.value = data || []

    const total = totalMessages.value
    visibleCount.value = Math.min(step, total)
    finished.value = visibleCount.value >= total

    await nextTick()
    if (scrollArea.value) {
      scrollArea.value.scrollTop = scrollArea.value.scrollHeight
    }
  } catch (error) {
    console.error('Chyba pri načítaní správ z API', error)
    rawMessages.value = []
  } finally {
    loading.value = false
  }
}

/* ===== infinite scroll callback ===== */

const onLoad = (index: number, done: (finished?: boolean) => void) => {
  if (loading.value) {
    done()
    return
  }
  if (finished.value) {
    done(true)
    return
  }

  isLoading.value = true

  const el = scrollArea.value
  const prevScrollHeight = el?.scrollHeight ?? 0

  setTimeout(() => {
    const total = totalMessages.value
    const next = Math.min(visibleCount.value + step, total)
    visibleCount.value = next

    void nextTick(() => {
      const newScrollHeight = el?.scrollHeight ?? 0
      if (el) {
        el.scrollTop += newScrollHeight - prevScrollHeight
      }

      isLoading.value = false

      if (visibleCount.value >= total) {
        finished.value = true
        done(true)
      } else {
        done()
      }
    })
  }, 300)
}

/* ===== parsovanie @mention ===== */

const chunks = (text: string): Chunk[] => {
  const re = /\B@([\p{L}\p{N}_-]+)/gu
  const out: Chunk[] = []
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push({ type: 'text', value: text.slice(last, m.index) })
    }
    const captured = m[1]
    if (typeof captured === 'string') {
      out.push({ type: 'mention', value: captured })
    } else {
      out.push({ type: 'text', value: text.slice(m.index, re.lastIndex) })
    }
    last = re.lastIndex
  }

  if (last < text.length) {
    out.push({ type: 'text', value: text.slice(last) })
  }

  return out
}

/* ===== eventy z MainLayoutu ===== */

const handleChannelSelected = (event: Event) => {
  const detail = (event as CustomEvent<{ id: number; title: string }>).detail
  const previousChannelId = activeChannelId.value

  console.log('📺 Channel selected:', detail.id, 'Previous:', previousChannelId)

  // Clear typing indicators when switching channels
  typingUsers.value = []
  typingTimeouts.forEach(timeout => clearTimeout(timeout))
  typingTimeouts.clear()

  // Leave previous channel if any
  if (previousChannelId && previousChannelId !== detail.id) {
    leaveChannel(previousChannelId)
  }

  activeChannelId.value = detail.id
  activeChannelTitle.value = detail.title

  // Ensure socket is initialized and connected
  if (!socket) {
    console.warn('⚠️ Socket not initialized, initializing now...')
    initSocket()
  }

  // Join new channel (will wait for connection if needed)
  joinChannel(detail.id)

  void loadMessagesForChannel()
}

const handleCurrentUserUpdated = (event: Event) => {
  const detail = (event as CustomEvent<CurrentUser>).detail
  currentUser.value = detail
}

// Function to add a message optimistically (before server confirms)
const addMessageOptimistically = (content: string): number => {
  if (!currentUser.value || !activeChannelId.value) {
    return -1
  }

  const optimisticMessage: MessageFromApi = {
    id: -Date.now(), // Temporary negative ID
    content: content,
    timestamp: new Date().toISOString(),
    sender: {
      id: currentUser.value.id,
      nickname: currentUser.value.nickname,
      firstname: currentUser.value.firstname,
      surname: currentUser.value.surname,
      email: currentUser.value.email,
      profilePicture: currentUser.value.profilePicture || null,
    }
  }

  rawMessages.value.push(optimisticMessage)

  const total = rawMessages.value.length
  if (visibleCount.value < total) {
    visibleCount.value = Math.min(visibleCount.value + 1, total)
  }

  void nextTick(() => {
    if (scrollArea.value) {
      scrollArea.value.scrollTop = scrollArea.value.scrollHeight
    }
  })

  return optimisticMessage.id
}

// Expose functions to window for MainLayout to call
declare global {
  interface Window {
    addMessageToChat: (content: string) => number | null;
    emitTyping: (isTyping: boolean, draftContent?: string) => void;
  }
}

if (typeof window !== 'undefined') {
  window.addMessageToChat = (content: string): number | null => {
    if (!activeChannelId.value || !currentUser.value) return null
    return addMessageOptimistically(content)
  }

  window.emitTyping = (isTyping: boolean, draftContent?: string) => {
    if (!socket?.connected || !activeChannelId.value || !currentUser.value) return

    const userName = currentUser.value.firstname && currentUser.value.surname
      ? `${currentUser.value.firstname} ${currentUser.value.surname}`
      : currentUser.value.nickname || currentUser.value.email

    if (isTyping) {
      socket.emit('typing:update', {
        channelId: activeChannelId.value,
        userId: currentUser.value.id,
        userName: userName,
        userAvatar: currentUser.value.profilePicture,
        draftContent: draftContent || ''
      })
    } else {
      socket.emit('typing:stop', {
        channelId: activeChannelId.value,
        userId: currentUser.value.id
      })
    }
  }
}

/* ===== notifikácie (ako v pôvodnej verzii) ===== */

const notificationsSupported =
  typeof window !== 'undefined' && typeof Notification !== 'undefined'

const notificationPermission = ref<NotificationPermission>(
  notificationsSupported ? Notification.permission : 'default',
)

let notificationTimer: ReturnType<typeof setTimeout> | null = null

const showNotification = () => {
  if (!notificationsSupported) return
  if (notificationPermission.value !== 'granted') {
    return
  }

  const last = uiMessages.value[uiMessages.value.length - 1]
  if (!last) return

  const notification = new Notification(last.name, {
    body: last.text,
    icon: last.avatar,
    badge: 'https://cdn-icons-png.flaticon.com/512/1384/1384069.png',
  })
  notification.onclick = () => {
    window.focus()
  }
}

const handleVisibilityChange = () => {
  if (!notificationsSupported) return

  if (document.visibilityState === 'hidden') {
    notificationTimer = setTimeout(() => {
      showNotification()
    }, 3000)
  } else if (notificationTimer) {
    clearTimeout(notificationTimer)
    notificationTimer = null
  }
}

/* ===== lifecycle ===== */

onMounted(() => {
  const stored = localStorage.getItem('currentUser')
  if (stored) currentUser.value = JSON.parse(stored)

  // Initialize socket.io connection immediately
  initSocket()

  // Ensure socket connects and joins channel when ready
  if (socket) {
    if (socket.connected) {
      // Already connected, join channel if needed
      console.log('✅ Socket already connected on mount')
      if (activeChannelId.value) {
        joinChannel(activeChannelId.value)
      }
    } else {
      // Wait for connection
      console.log('⏳ Waiting for socket connection...')
      socket.once('connect', () => {
        console.log('✅ Socket connected after mount, joining channel if needed')
        if (activeChannelId.value) {
          joinChannel(activeChannelId.value)
        }
      })
    }

    // Also listen for any future reconnections
    socket.on('reconnect', () => {
      console.log('🔄 Socket reconnected, rejoining channel if needed')
      if (activeChannelId.value) {
        joinChannel(activeChannelId.value)
      }
    })
  } else {
    console.error('❌ Failed to initialize socket')
  }

  window.addEventListener(
    'channelSelected',
    handleChannelSelected as EventListener,
  )

  window.addEventListener(
    'currentUserUpdated',
    handleCurrentUserUpdated as EventListener,
  )

  if (notificationsSupported) {
    notificationPermission.value = Notification.permission
    if (
      Notification.permission !== 'granted' &&
      Notification.permission !== 'denied'
    ) {
      Notification.requestPermission()
        .then((permission) => {
          notificationPermission.value = permission
        })
        .catch((err) => {
          console.error('Chyba pri žiadaní o povolenie na notifikácie:', err)
        })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
  }
})

onUnmounted(() => {
  // Disconnect socket.io
  disconnectSocket()

  window.removeEventListener(
    'channelSelected',
    handleChannelSelected as EventListener,
  )

  window.removeEventListener(
    'currentUserUpdated',
    handleCurrentUserUpdated as EventListener,
  )

  if (notificationsSupported) {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
  if (notificationTimer) {
    clearTimeout(notificationTimer)
    notificationTimer = null
  }
})
</script>

<style scoped>

.mention-highlight {
  background: #fff7c2;
  border-left: 4px solid #f4c20d;
  border-radius: 6px;
  padding-left: 8px;
}


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

.chat-header {
  background: #ffe0b2;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
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

.loading-banner {
  position: sticky;
  top: 0;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(2px);
  color: #2c3e50;
  font-weight: 600;
}

/* text bubliny + @mention */

.bubble-text {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.mention {
  display: inline-block;
  padding: 0 4px;
  margin: 0 1px;
  border-radius: 4px;
  background-color: #43a047;
  color: white;
  font-weight: 600;
}

/* Typing indicator - fixed bottom left */
.typing-indicator-fixed {
  position: fixed;
  bottom: 80px;
  left: 20px;
  z-index: 2000;
  max-width: 300px;
  min-width: 200px;
}

.typing-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(8px);
}

.typing-user-item {
  margin-bottom: 8px;
}

.typing-user-item:last-child {
  margin-bottom: 0;
}

.draft-content {
  font-style: italic;
  word-break: break-word;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  color: #666;
}

.typing-dots {
  display: inline-flex;
  margin-left: 0;
}

.typing-dots span {
  animation: typing-dot 1.4s infinite;
  margin: 0 2px;
  font-size: 20px;
  line-height: 1;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-dot {
  0%, 60%, 100% {
    opacity: 0.3;
  }
  30% {
    opacity: 1;
  }
}
.msg-avatar {
  flex-shrink: 0;
}

/* prijaté správy – avatar vľavo, trochu ďalej od bubliny */
.msg-avatar--received {
  margin-right: 8px;
}

/* odoslané správy – avatar vpravo, trochu ďalej od bubliny */
.msg-avatar--sent {
  margin-left: 8px;
}

</style>
