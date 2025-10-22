// src/composables/chatStore.ts
import { reactive, watch } from 'vue'

export type Message = {
  id: string
  text: string
  author: 'me' | 'other'
  ts: number
}

type State = {
  messagesByChannel: Record<string, Message[]>
}

// načítaj z localStorage, ak existuje
const persisted = typeof localStorage !== 'undefined'
  ? localStorage.getItem('chat.messages')
  : null

const state = reactive<State>({
  messagesByChannel: persisted ? JSON.parse(persisted) : {}
})

/**
 * Pridá správu do kanála (lokálne, bez backendu).
 */
function sendMessage(channelId: string, text: string) {
  const t = text?.trim()
  if (!t) return

  // vytvor pole pre kanál, ak ešte nie je
  const list = (state.messagesByChannel[channelId] ||= [])

  list.push({
    id: Math.random().toString(36).slice(2),
    text: t,
    author: 'me',
    ts: Date.now()
  })
}

// perzistencia do localStorage
watch(
  () => state.messagesByChannel,
  (val) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('chat.messages', JSON.stringify(val))
      }
    } catch {
      // ticho – napr. private mode
    }
  },
  { deep: true }
)

export function useChatStore() {
  return { state, sendMessage }
}
