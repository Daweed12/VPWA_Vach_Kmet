<template>
  <q-page class="chat-page">
    <div class="chat-wrapper">
      <div ref="scrollArea" id="chat-scroll" class="chat-scroll">
        <q-infinite-scroll
          reverse
          @load="loadOlder"
          :offset="10"
          scroll-target="#chat-scroll"
        >
          <div
            v-for="(msg, index) in visibleMessages"
            :key="index"
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
              <div v-html="formatMessageForHtml(msg.text)"></div>
            </q-chat-message>
          </div>

          <template #loading>
            <div class="text-grey q-my-md flex justify-center">
              <q-spinner-dots size="40px" color="primary" />
            </div>
          </template>
        </q-infinite-scroll>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Message {
  from: string;
  name: string;
  avatar: string;
  text: string;
}

const me = { id: 'me', name: 'Ja', avatar: 'https://cdn.quasar.dev/img/avatar3.jpg' }
const jane = { id: 'jane', name: 'Jane', avatar: 'https://cdn.quasar.dev/img/avatar5.jpg' }

const allMessages: Message[] = [
  { from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Ahoj, ako sa máš? Už si videl dnešné správy?' },
  { from: me.id, name: me.name, avatar: me.avatar, text: 'Ahoj, mám sa fajn. Ešte som ich nepozeral, čo sa deje?' },
  { from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Nič dôležité, len bežné veci. Ale počul som, že počasie má byť cez víkend super!' },
  { from: me.id, name: me.name, avatar: me.avatar, text: 'To znie skvele! Plánuješ niečo?' },
  // Správa s @mention pre testovanie
  { from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Možno výlet do hôr, ak nebude pršať. Dáš vedieť @Ja?' },
  { from: me.id, name: me.name, avatar: me.avatar, text: 'To znie super! Zober si aj foťák.' },
  { from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Jasné, mám v pláne spraviť pár fotiek.' },
  { from: me.id, name: me.name, avatar: me.avatar, text: 'Teším sa, pošli mi potom niečo.' },
  { from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Určite! 😊' },
  { from: me.id, name: me.name, avatar: me.avatar, text: 'Super, držím palce s počasím!' },
  { from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Díky! 😉' },
  { from: me.id, name: me.name, avatar: me.avatar, text: 'Vidíme sa v pondelok!' },
  { from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Ahoj, ako sa máš? Už si videl dnešné správy?' },
  { from: me.id, name: me.name, avatar: me.avatar, text: 'Ahoj, mám sa fajn. Ešte som ich nepozeral, čo sa deje?' },
  { from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Nič dôležité, len bežné veci. Ale počul som, že počasie má byť cez víkend super!' },
  { from: me.id, name: me.name, avatar: me.avatar, text: 'To znie skvele! Plánuješ niečo?' },
  { from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Možno výlet do hôr, ak nebude pršať.' },
  { from: me.id, name: me.name, avatar: me.avatar, text: 'To znie super! Zober si aj foťák.' },
  { from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Jasné, mám v pláne spraviť pár fotiek.' },
  { from: me.id, name: me.name, avatar: me.avatar, text: 'Teším sa, pošli mi potom niečo.' },
  { from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Určite! 😊' },
  { from: me.id, name: me.name, avatar: me.avatar, text: 'Super, držím palce s počasím @Jane!' },
  { from: jane.id, name: jane.name, avatar: jane.avatar, text: 'Díky! 😉' },
  { from: me.id, name: me.name, avatar: me.avatar, text: 'Vidíme sa v pondelok!' }
]

const step = 6
const visibleMessages = ref<Message[]>(allMessages.slice(-step))
const scrollArea = ref<HTMLElement | null>(null)

function loadOlder(index: number, done: (finished?: boolean) => void) {
  setTimeout(() => {
    const currentCount = visibleMessages.value.length
    const newCount = currentCount + step
    const newStart = Math.max(allMessages.length - newCount, 0)
    visibleMessages.value = allMessages.slice(newStart)
    if (newStart === 0) done(true)
    else done()
  }, 300)
}

// --- NOVÉ (Cieľ 1): Funkcia na formátovanie textu pre v-html ---
/**
 * Nájde všetky @mentions v texte a obalí ich do <span class="mention">
 */
const formatMessageForHtml = (text: string): string => {
  // Regex nájde @ nasledované písmenami, číslami, alebo pomlčkou
  const mentionRegex = /@([\w-]+)/g;

  // Nahradíme nájdený text (napr. @Ja) za <span...>@Ja</span>
  // Používame $& na vloženie celého nájdeného textu (vrátane @)
  return text.replace(mentionRegex, '<span class="mention">$&</span>');
}


// --- Logika pre notifikácie (Cieľ 2) - BEZ ZMENY ---
const notificationPermission = ref(Notification.permission)
let notificationTimer: ReturnType<typeof setTimeout> | null = null

const showNotification = () => {
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
  if (document.visibilityState === 'hidden') {
    notificationTimer = setTimeout(() => {
      showNotification()
    }, 3000)
  } else {
    if (notificationTimer) {
      clearTimeout(notificationTimer)
    }
  }
}
// --- KONIEC Logiky pre notifikácie ---


onMounted(() => {
  if (scrollArea.value) {
    scrollArea.value.scrollTop = scrollArea.value.scrollHeight
  }

  // --- Žiadosť o povolenie (aj s opravou ESLint chyby) ---
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      notificationPermission.value = permission
    })
      .catch(err => { // Pridaný .catch blok
        console.error('Chyba pri žiadaní o povolenie na notifikácie:', err)
      })
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  if (notificationTimer) {
    clearTimeout(notificationTimer)
  }
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #ffcc80;
}

.chat-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column-reverse;
  padding: 16px;
}

.chat-scroll::-webkit-scrollbar {
  display: none;
}
.chat-scroll {
  scrollbar-width: none;
}

/* --- NOVÉ (Cieľ 1): Štýl pre zvýraznené @mention --- */
/* Používame :deep() aby sme prenikli 'scoped' štýlovanie
  a mohli nastylovať obsah pridaný cez 'v-html'.
*/
:deep(.mention) {
  background-color: green; /* Jasná žltá */
  color: white; /* Čierny text */
  font-weight: bold;
  padding: 0 3px;
  border-radius: 3px;
}
</style>
