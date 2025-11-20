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
      <div ref="scrollArea" class="chat-scroll">
        <!-- placeholder keď nie je vybraný kanál -->
        <div
          v-if="!activeChannelId && !loading"
          class="full-height column items-center justify-center text-grey-7 q-pa-lg"
        >
          <q-icon name="chat_bubble_outline" size="48px" class="q-mb-sm" />
          <div class="text-subtitle1 text-center">
            Zatiaľ nie je vybraný žiadny kanál.
          </div>
          <div class="text-caption text-center q-mt-xs">
            Klikni na kanál vľavo a zobrazí sa konverzácia z databázy.
          </div>
        </div>

        <!-- loader -->
        <div
          v-else-if="loading"
          class="full-height column items-center justify-center text-grey-7 q-pa-lg"
        >
          <q-spinner-dots size="32px" class="q-mb-sm" />
          <div class="text-caption">Načítavam správy…</div>
        </div>

        <!-- žiadne správy -->
        <div
          v-else-if="uiMessages.length === 0"
          class="full-height column items-center justify-center text-grey-7 q-pa-lg"
        >
          <q-icon name="hourglass_empty" size="32px" class="q-mb-sm" />
          <div class="text-caption text-center">
            Tento kanál zatiaľ nemá žiadne správy.
          </div>
        </div>

        <!-- správy z databázy -->
        <div
          v-else
          class="q-pt-sm q-pb-lg"
        >
          <div
            v-for="msg in uiMessages"
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
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { api } from 'boot/api'

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
  senderId: number
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

const activeChannelId = ref<number | null>(null)
const activeChannelTitle = ref<string | null>(null)

const currentUser = ref<CurrentUser | null>(null)

const rawMessages = ref<MessageFromApi[]>([])
const loading = ref(false)
const scrollArea = ref<HTMLElement | null>(null)

/**
 * Prevod správ z API na formát pre q-chat-message
 */
const uiMessages = computed<UiMessage[]>(() => {
  return rawMessages.value.map((m) => {
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

/**
 * Rozbitie textu na obyčajný text + @mentions
 */
const chunks = (text: string): Chunk[] => {
  const re = /\B@([\p{L}\p{N}_-]+)/gu
  const out: Chunk[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(text)) !== null) {
    const [full, username] = match
    const index = match.index

    if (index > lastIndex) {
      out.push({ type: 'text', value: text.slice(lastIndex, index) })
    }

    out.push({ type: 'mention', value: username })
    lastIndex = index + full.length
  }

  if (lastIndex < text.length) {
    out.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return out
}

/**
 * Načítanie currentUser z localStorage
 */
const loadCurrentUserFromStorage = () => {
  try {
    const raw = localStorage.getItem('currentUser')
    if (raw) {
      currentUser.value = JSON.parse(raw) as CurrentUser
    }
  } catch (e) {
    console.error('Chyba pri čítaní currentUser z localStorage', e)
  }
}

/**
 * Načítanie správ pre aktívny kanál
 */
const loadMessagesForChannel = async () => {
  if (!activeChannelId.value) {
    rawMessages.value = []
    return
  }

  loading.value = true
  try {
    const { data } = await api.get<MessageFromApi[]>(
      `/channels/${activeChannelId.value}/messages`,
    )
    rawMessages.value = data

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

/**
 * Handler pre event z MainLayoutu – klik na kanál
 */
function handleChannelSelected (event: Event) {
  const custom = event as CustomEvent<{ id: number; title: string }>
  activeChannelId.value = custom.detail.id
  activeChannelTitle.value = custom.detail.title
  void loadMessagesForChannel()
}

/**
 * Handler pre aktualizáciu currentUser (napr. po logine)
 */
function handleCurrentUserUpdated (event: Event) {
  const custom = event as CustomEvent<CurrentUser>
  currentUser.value = custom.detail
}

onMounted(() => {
  loadCurrentUserFromStorage()

  window.addEventListener(
    'channelSelected',
    handleChannelSelected as EventListener,
  )

  window.addEventListener(
    'currentUserUpdated',
    handleCurrentUserUpdated as EventListener,
  )
})

onUnmounted(() => {
  window.removeEventListener(
    'channelSelected',
    handleChannelSelected as EventListener,
  )

  window.removeEventListener(
    'currentUserUpdated',
    handleCurrentUserUpdated as EventListener,
  )
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
}

.chat-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(4px);
}

.chat-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0 16px;
}

/* bubliny */
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
