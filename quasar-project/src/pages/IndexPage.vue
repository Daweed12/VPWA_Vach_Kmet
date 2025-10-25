<template>
  <q-page class="chat-page">
    <div class="chat-wrapper">
      <div ref="scrollArea" id="chat-scroll" class="chat-scroll">
        <q-infinite-scroll
          reverse
          @load="onLoad"
          :offset="120"
          :debounce="120"
          scroll-target="#chat-scroll"
        >
          <!-- správy -->
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
                <!-- JEDEN root element, aby Quasar nevytváral viac bubliniek -->
                <span class="bubble-text">
                  <span v-for="(chunk, i) in chunks(msg.text)" :key="msg.id + '-' + i">
                    <span v-if="chunk.type === 'mention'" class="mention">@{{ chunk.value }}</span>
                    <span v-else>{{ chunk.value }}</span>
                  </span>
                </span>
              </template>
            </q-chat-message>
          </div>

          <!-- výrazný sticky loading banner hore pri reverse -->
          <template #loading>
            <div class="loading-banner" v-show="isLoading">
              <q-spinner-dots size="24px" />
              <span class="ml-2">Načítavam staršie správy…</span>
            </div>
          </template>
        </q-infinite-scroll>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

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

// --- demo data s unikátnymi id (cca 30 správ, 3 ľudia, @mentiony)
const allMessages: Message[] = [
  { id: 'm1',  from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Čaute! @Ja @Max idete dnes na ten streetfood festival?' },
  { id: 'm2',  from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Ahoj! Ja môžem po 17:00. Ako to vyzerá s tebou, @Max?' },
  { id: 'm3',  from: max.id,  name: max.name,  avatar: max.avatar,  text: 'Zdravím! Ja som free už od 16:30. Dáme stretko pri hlavnom vchode?' },
  { id: 'm4',  from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Sedí. Inak, počasie hlásia fajn, bez dažďa. 🌤️' },
  { id: 'm5',  from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Super! Dáme aj mini plán na víkend? Zvažujem menší výšlap.' },
  { id: 'm6',  from: max.id,  name: max.name,  avatar: max.avatar,  text: '@Ja to znie super. Kde? Malé Karpaty alebo radšej niečo ľahšie?' },
  { id: 'm7',  from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Mne by vyhovoval Devín – nenáročné a pekné výhľady. @Ja @Max?' },
  { id: 'm8',  from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Som za Devín. V nedeľu doobeda? 10:00 pri zastávke?' },
  { id: 'm9',  from: max.id,  name: max.name,  avatar: max.avatar,  text: 'OK. Beriem foťák a powerbanku. @Jane, ty donesieš deku?' },
  { id: 'm10', from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Jasné, deku a ovocie vybavím. 🍎' },
  { id: 'm11', from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Ešte k dnešku – @Jane spomínala si tacos. Ideme na ne ako prvé? 🌮' },
  { id: 'm12', from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Áno! A potom dáme limonádu. @Max, ty si objednávaš niečo pikantné, že?' },
  { id: 'm13', from: max.id,  name: max.name,  avatar: max.avatar,  text: 'Pikantné je životný štýl. 🌶️ Dám si “extra hot”.' },
  { id: 'm14', from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Nezabudnite mi pripomenúť fotku na tímový kanál. @Jane, prosím ťa 🙏' },
  { id: 'm15', from: jane.id, name: jane.name, avatar: jane.avatar, text: '@Ja jasné, pingnem ťa: “@Ja fotka sem!” 😄' },
  { id: 'm16', from: max.id,  name: max.name,  avatar: max.avatar,  text: 'Inak kto berie hotovosť? Niektoré stánky vraj idú len keš.' },
  { id: 'm17', from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Mám drobné. Ak bude treba, preplatíte mi to neskôr.' },
  { id: 'm18', from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Díky! Pošlem cez revolut. @Max, sedí?' },
  { id: 'm19', from: max.id,  name: max.name,  avatar: max.avatar,  text: 'Jasné, pošlem hneď večer. 👍' },
  { id: 'm20', from: me.id,   name: me.name,   avatar: me.avatar,   text: 'Mimochodom, máme už playlist na cestu v nedeľu? 🎶' },
  { id: 'm21', from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Spravím Spotify kolaboratívny a pridám vás. @Ja @Max hoďte 3 pesničky.' },
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

// --- paging & UI state
const step = 6
const visibleMessages = ref<Message[]>(allMessages.slice(-step))
const scrollArea = ref<HTMLElement | null>(null)
const finished = ref(false)
const isLoading = ref(false)

// --- loader wrapper: nastaví isLoading a deleguje na loadOlder
function onLoad(index: number, done: (finished?: boolean) => void) {
  isLoading.value = true
  loadOlder(index, (f?: boolean) => {
    isLoading.value = false
    done(f)
  })
}

// --- prepend starších správ so zachovaním scroll pozície
function loadOlder(index: number, done: (finished?: boolean) => void) {
  if (finished.value) return done(true)

  const el = scrollArea.value
  const prevScrollHeight = el?.scrollHeight ?? 0

  // Simulácia oneskorenia – počas tohto času sa zobrazí #loading banner
  setTimeout(() => {
    const currentCount = visibleMessages.value.length
    const newCount = currentCount + step
    const newStart = Math.max(allMessages.length - newCount, 0)
    visibleMessages.value = allMessages.slice(newStart)

    // Po mutácii počkaj na DOM update – callback verzia + explicitné ignorovanie Promise:
    void nextTick(() => {
      // zachovaj content offset, nech neskáče scroll
      const newScrollHeight = el?.scrollHeight ?? 0
      if (el) el.scrollTop += newScrollHeight - prevScrollHeight

      if (newStart === 0) {
        finished.value = true
        done(true) // povie QInfiniteScroll, že už niet čo načítať
      } else {
        done()
      }
    })
  }, 500)
}

// --- Bezpečné zvýraznenie @mentions bez v-html
const chunks = (text: string): Chunk[] => {
  // \B@ = začiatok na hranici slova, Unicode písmená/čísla/_,-
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

// --- Notifikácie (ošetrené podľa podpory)
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
  // po prvom renderi scrollni naspodok — callback + void
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
}

.chat-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column; /* natural flow (bez reverse) */
  padding: 16px;
}

/* skryť scrollbar vizuálne */
.chat-scroll::-webkit-scrollbar {
  display: none;
}
.chat-scroll {
  scrollbar-width: none;
}

/* Sticky loading banner z #loading slotu (pri reverse je navrchu) */
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

/* text vo vnútri jednej bubliny */
:deep(.bubble-text) {
  white-space: pre-wrap;   /* zachová medzery/riadky */
  word-break: break-word;  /* neláme bublinu */
  display: inline;         /* jeden inline flow = jedna bublina */
}

/* zvýraznenie @mention */
:deep(.mention) {
  background-color: green;
  color: white;
  font-weight: bold;
  padding: 0 3px;
  border-radius: 3px;
  display: inline-block;   /* pekná pilulka, ale stále v rámci jedného riadku */
}
</style>
