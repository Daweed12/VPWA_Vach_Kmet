<template>
  <q-page class="chat-page">
    <div class="chat-wrapper">
      <div ref="scrollArea" id="chat-scroll" class="chat-scroll">
        <q-infinite-scroll
          reverse
          @load="onLoad"
          :offset="10"
          :debounce="120"
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
              :sent="msg.from === 'me'"
              :bg-color="msg.from === 'me' ? 'primary' : 'grey-3'"
              :text-color="msg.from === 'me' ? 'white' : 'black'"
              class="shadow-sm"
            >
              <template #default>
                <span class="bubble-text">
                  <span v-for="(chunk, i) in chunks(msg.text)" :key="msg.id + '-' + i">
                    <span v-if="chunk.type === 'mention'" class="mention">@{{ chunk.value }}</span>
                    <span v-else>{{ chunk.value }}</span>
                  </span>
                </span>
              </template>
            </q-chat-message>
          </div>

          <template v-slot:loading>
            <div class="loading-banner" v-show="isLoading">
              <q-spinner-dots size="24px" />
              <span class="ml-2">Načítavam staršie správy…</span>
            </div>
          </template>
        </q-infinite-scroll>

        <!-- Typing indicator (klikni pre náhľad) -->
        <div v-if="isTyping" class="typing-row q-mt-sm cursor-pointer">
          <div
            class="avatars"
            :style="`width: ${28 + Math.max(typingUsers.length - 1, 0) * 18}px`"
          >
            <q-avatar
              v-for="(u, idx) in typingUsers"
              :key="u.id"
              size="28px"
              class="overlapping"
              :style="`left: ${idx * 18}px`"
            >
              <img :src="u.avatar" :alt="u.name" />
            </q-avatar>
          </div>

          <div class="label">
            <span class="typing-text">{{ typingLabel }}</span>
            <q-spinner-dots size="18px" class="ml-2" />
          </div>

          <!-- Popup s draftami po kliknutí -->
          <q-popup-proxy transition-show="scale" transition-hide="scale">
            <q-card class="typing-card">
              <q-list dense>
                <q-item v-for="u in typingDrafts" :key="u.id">
                  <q-item-section avatar>
                    <q-avatar size="28px">
                      <img :src="u.avatar" :alt="u.name" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="font-600">{{ u.name }}</q-item-label>
                    <q-item-label caption class="draft-text">“{{ u.draft }}”</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </q-popup-proxy>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'

interface Message {
  id: string
  from: string
  name: string
  avatar: string
  text: string
}

type Chunk = { type: 'text' | 'mention'; value: string }

const me   = { id: 'me',   name: 'Ja',   avatar: 'https://cdn.quasar.dev/img/avatar4.jpg' }
const jane = { id: 'jane', name: 'Jane', avatar: 'https://cdn.quasar.dev/img/avatar5.jpg' }
const max  = { id: 'max',  name: 'Max',  avatar: 'https://cdn.quasar.dev/img/avatar6.jpg' }

const allMessages: Message[] = [
  { id: 'm1',  from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Čaute! @Eren @Max idete dnes na ten streetfood festival?' },
  { id: 'm2',  from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Ahoj! Ja môžem po 17:00. Ako to vyzerá s tebou, @Max?' },
  { id: 'm3',  from: max.id,  name: max.name,  avatar: max.avatar,  text: 'Zdravím! Ja som free už od 16:30. Dáme stretko pri hlavnom vchode?' },
  { id: 'm4',  from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Sedí. Inak, počasie hlásia fajn, bez dažďa. 🌤️' },
  { id: 'm5',  from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Super! Dáme aj mini plán na víkend? Zvažujem menší výšlap.' },
  { id: 'm6',  from: max.id,  name: max.name,  avatar: max.avatar,  text: '@Eren to znie super. Kde? Malé Karpaty alebo radšej niečo ľahšie?' },
  { id: 'm7',  from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Mne by vyhovoval Devín – nenáročné a pekné výhľady. @Eren @Max?' },
  { id: 'm8',  from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Som za Devín. V nedeľu doobeda? 10:00 pri zastávke?' },
  { id: 'm9',  from: max.id,  name: max.name,  avatar: max.avatar,  text: 'OK. Beriem foťák a powerbanku. @Jane, ty donesieš deku?' },
  { id: 'm10', from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Jasné, deku a ovocie vybavím. 🍎' },
  { id: 'm11', from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Ešte k dnešku – @Jane spomínala si tacos. Ideme na ne ako prvé? 🌮' },
  { id: 'm12', from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Áno! A potom dáme limonádu. @Max, ty si objednávaš niečo pikantné, že?' },
  { id: 'm13', from: max.id,  name: max.name,  avatar: max.avatar,  text: 'Pikantné je životný štýl. 🌶️ Dám si “extra hot”.' },
  { id: 'm14', from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Nezabudnite mi pripomenúť fotku na tímový kanál. @Jane, prosím ťa 🙏' },
  { id: 'm15', from: jane.id, name: jane.name, avatar: jane.avatar, text: '@Eren jasné, pingnem ťa: “@Eren fotka sem!” 😄' },
  { id: 'm16', from: max.id,  name: max.name,  avatar: max.avatar,  text: 'Inak kto berie hotovosť? Niektoré stánky vraj idú len keš.' },
  { id: 'm17', from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Mám drobné. Ak bude treba, preplatíte mi to neskôr.' },
  { id: 'm18', from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Díky! Pošlem cez revolut. @Max, sedí?' },
  { id: 'm19', from: max.id,  name: max.name,  avatar: max.avatar,  text: 'Jasné, pošlem hneď večer. 👍' },
  { id: 'm20', from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Mimochodom, máme už playlist na cestu v nedeľu? 🎶' },
  { id: 'm21', from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Spravím Spotify kolaboratívny a pridám vás. @Eren @Max hoďte 3 pesničky.' },
  { id: 'm22', from: max.id,  name: max.name,  avatar: max.avatar,  text: 'Pridám niečo chill. A vezmem malý reprák.' },
  { id: 'm23', from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Top! Ešte otázka: berieme aj @Jane psa? 🐶' },
  { id: 'm24', from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Ak nevadí, vezmem ho. Je kľudný a má vodítko.' },
  { id: 'm25', from: max.id,  name: max.name,  avatar: max.avatar,  text: 'Za mňa v pohode. Zoberiem navyše misku na vodu.' },
  { id: 'm26', from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Logistika: dnes 17:00 festival – hlavný vchod; nedeľa 10:00 Devín – zastávka. Súhlas?' },
  { id: 'm27', from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Potvrdené ✅ A ľahké tenisky, nech sa nám ide pohodlne.' },
  { id: 'm28', from: max.id,  name: max.name,  avatar: max.avatar,  text: 'Zoberiem aj náplasti, keby náhodou. 🩹' },
  { id: 'm29', from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Paráda, teším sa na oboje! @Jane @Max vidíme sa čoskoro.' },
  { id: 'm30', from: jane.id, name: jane.name, avatar: jane.avatar, text: 'See ya! A nezabudnite na hlad. 😉' }
]

const step = 6
const visibleMessages = ref<Message[]>(allMessages.slice(-step))
const scrollArea = ref<HTMLElement | null>(null)
const finished = ref(false)
const isLoading = ref(false)

/* ---------- Typing indicator stav ---------- */
const typingUsers = ref([jane, max, me]) // poradie určí meno v texte
const isTyping = ref(true)
const typingLabel = computed(() => {
  const first = typingUsers.value[0]?.name ?? 'Someone'
  const others = Math.max(typingUsers.value.length - 1, 0)
  return others > 0 ? `${first} and ${others} others is typing...` : `${first} is typing...`
})

// Statické "drafty" – čo kto práve píše (len príklad)
const draftsById: Record<string, string> = {
  [jane.id]: 'Mám tip na skvelé tacos stánky pri vchode.',
  [max.id]: 'Zoberiem ešte powerbanku naviac, keby niečo.',
  [me.id]:  'Hodím do playlistu tri nové songy.'
}

const typingDrafts = computed(() =>
  typingUsers.value.map(u => ({
    ...u,
    draft: draftsById[u.id] ?? '...'
  }))
)
/* ------------------------------------------ */

function onLoad(index: number, done: (finished?: boolean) => void) {
  isLoading.value = true
  loadOlder(index, (f?: boolean) => {
    isLoading.value = false
    done(f)
  })
}

function loadOlder(index: number, done: (finished?: boolean) => void) {
  if (finished.value) return done(true)

  const el = scrollArea.value
  const prevScrollHeight = el?.scrollHeight ?? 0

  setTimeout(() => {
    const currentCount = visibleMessages.value.length
    const newCount = currentCount + step
    const newStart = Math.max(allMessages.length - newCount, 0)
    visibleMessages.value = allMessages.slice(newStart)

    void nextTick(() => {
      const newScrollHeight = el?.scrollHeight ?? 0
      if (el) el.scrollTop += newScrollHeight - prevScrollHeight

      if (newStart === 0) {
        finished.value = true
        done(true)
      } else {
        done()
      }
    })
  }, 500)
}

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
  if (last < text.length) out.push({ type: 'text', value: text.slice(last) })
  return out
}

const notificationsSupported =
  typeof window !== 'undefined' && typeof Notification !== 'undefined'

const notificationPermission = ref<NotificationPermission>(
  notificationsSupported ? Notification.permission : 'default'
)

let notificationTimer: ReturnType<typeof setTimeout> | null = null

const showNotification = () => {
  if (!notificationsSupported) return
  if (notificationPermission.value !== 'granted') {
    console.log('Notifikácie nie sú povolené.')
    return
  }
  const fakeMsg = {
    name: 'Jane (Nová správa)',
    text: 'Ozvem sa ti neskôr, teraz som zaneprázdnená.',
    avatar: jane.avatar
  }
  const notification = new Notification(fakeMsg.name, {
    body: fakeMsg.text,
    icon: fakeMsg.avatar,
    badge: 'https://cdn-icons-png.flaticon.com/512/1384/1384069.png'
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
  } else {
    if (notificationTimer) {
      clearTimeout(notificationTimer)
      notificationTimer = null
    }
  }
}

onMounted(() => {
  void nextTick(() => {
    if (scrollArea.value) {
      scrollArea.value.scrollTop = scrollArea.value.scrollHeight
    }
  })

  if (notificationsSupported) {
    notificationPermission.value = Notification.permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
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
  background: rgba(0,0,0,0.08);
  backdrop-filter: blur(2px);
  color: #2c3e50;
  font-weight: 600;
}

:deep(.bubble-text) {
  white-space: pre-wrap;
  word-break: break-word;
  display: inline;
}

:deep(.mention) {
  background-color: green;
  color: white;
  font-weight: bold;
  padding: 0 3px;
  border-radius: 3px;
  display: inline-block;
}

/* --- Typing indicator --- */
.typing-row {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  align-self: flex-start;
}

.cursor-pointer { cursor: pointer; }

.avatars {
  position: relative;
  height: 28px; /* = veľkosť q-avatar */
}

.overlapping {
  position: absolute;
  border: 2px solid #ffcc80; /* ladí s .chat-page pozadím */
  border-radius: 9999px;
}

.typing-text {
  font-weight: 600;
  color: #2c3e50;
}

.label {
  display: inline-flex;
  align-items: center;
}

/* Popup karta s draftami */
.typing-card {
  min-width: 280px;
  max-width: 90vw;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.14);
}

.font-600 { font-weight: 600; }

.draft-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
