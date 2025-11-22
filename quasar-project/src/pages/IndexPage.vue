<template>
  <q-page class="chat-page">
    <div class="chat-wrapper">
      <!-- malý info header pod hlavnou lištou -->
      <div class="chat-header q-pa-md">
        <div
          v-if="activeChannelTitle"
          class="text-caption text-grey-7"
        >
          Zobrazuješ konverzáciu v kanáli {{ activeChannelTitle }}.
        </div>
        <div
          v-else
          class="text-caption text-grey-7"
        >
          Vyber si kanál v ľavom paneli a zobrazia sa jeho správy.
        </div>
      </div>

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

        <!-- 4) Správy + infinite scroll -->
        <div
          v-else
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
              class="q-px-sm q-py-xs"
            >
              <q-chat-message
                :name="msg.name"
                :avatar="msg.avatar"
                :sent="msg.sent"
                :bg-color="msg.sent ? 'primary' : 'grey-3'"
                :text-color="msg.sent ? 'white' : 'black'"
                class="shadow-sm"
              >
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
import { io } from 'socket.io-client'

/* ===== typy z API ===== */

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
  name: string
  avatar: string
  sent: boolean
  text: string
}

/* ===== stav stránky ===== */

const activeChannelId = ref<number | null>(null)
const activeChannelTitle = ref<string | null>(null)

const currentUser = ref<CurrentUser | null>(null)

const rawMessages = ref<MessageFromApi[]>([])
const loading = ref(false)

const scrollArea = ref<HTMLElement | null>(null)

/* ===== socket.io connection ===== */

interface SocketClient {
  id: string
  on(event: string, callback: (...args: unknown[]) => void): void
  emit(event: string, data: unknown): void
  disconnect(): void
}

let socket: SocketClient | null = null

const initSocket = () => {
  if (socket) return // už je inicializovaný

  socket = io('http://localhost:3333', {
    transports: ['websocket', 'polling']
  }) as SocketClient

  socket.on('connect', () => {
    console.log('Socket.IO connected:', socket?.id)
  })

  socket.on('disconnect', () => {
    console.log('Socket.IO disconnected')
  })

  socket.on('chat:message', (data: unknown) => {
    const message = data as MessageFromApi & { channelId?: number; channel_id?: number }
    // Pridaj správu len ak je pre aktuálny kanál
    if (activeChannelId.value && message.sender && message.content) {
      // Skontroluj, či správa patrí do aktuálneho kanála
      const messageChannelId = message.channelId || message.channel_id
      
      if (messageChannelId && messageChannelId === activeChannelId.value) {
        // Skontroluj, či správa už neexistuje (aby sme nepridali duplikát)
        const exists = rawMessages.value.some(m => m.id === message.id)
        if (!exists) {
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
        }
      }
    }
  })
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

const uiMessages = computed<UiMessage[]>(() => {
  return rawMessages.value
    .filter((m) => m.sender) // Filter out messages without sender
    .map((m) => {
      const s = m.sender
      const fullName =
        `${s.firstname ?? ''} ${s.surname ?? ''}`.trim() ||
        s.nickname ||
        s.email

      const meId = currentUser.value?.id ?? null
      const isMe = meId !== null && s.id === meId

      const avatar =
        s.profilePicture ||
        'https://cdn.quasar.dev/img/avatar.png'

      return {
        id: m.id,
        name: fullName,
        avatar,
        sent: isMe,
        text: m.content,
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
  activeChannelId.value = detail.id
  activeChannelTitle.value = detail.title
  void loadMessagesForChannel()
}

const handleCurrentUserUpdated = (event: Event) => {
  const detail = (event as CustomEvent<CurrentUser>).detail
  currentUser.value = detail
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

  // Initialize socket.io connection
  initSocket()

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
</style>
