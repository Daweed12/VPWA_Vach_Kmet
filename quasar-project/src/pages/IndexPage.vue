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
              :text="[msg.text]"
              :sent="msg.from === 'me'"
              :bg-color="getMessageColors(msg).bg"
              :text-color="getMessageColors(msg).text"
              class="shadow-sm"
            />
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
// --- ZMENA (Cieľ 2): Importujeme onUnmounted ---
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
  { from: me.id, name: me.name, avatar: me.avatar, text: 'Super, držím palce s počasím!' },
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

const getMessageColors = (msg: Message): { bg: string, text: string } => {
  // 1. Skontroluj 'mention'
  if (msg.text.includes('@')) {
    return { bg: 'orange-5', text: 'white' } // Zvýraznená farba
  }
  // 2. Tvoja pôvodná logika
  if (msg.from === 'me') {
    return { bg: 'primary', text: 'white' }
  }
  return { bg: 'grey-3', text: 'black' }
}

const notificationPermission = ref(Notification.permission)
let notificationTimer: ReturnType<typeof setTimeout> | null = null

const showNotification = () => {
  if (notificationPermission.value !== 'granted') {
    console.log('Notifikácie nie sú povolené.')
    return
  }

  // Simulovaná správa, ktorá sa zobrazí
  const fakeMsg = {
    name: 'Jane (Nová správa)',
    text: 'Ozvem sa ti neskôr, teraz som zaneprázdnená.',
    avatar: jane.avatar
  }

  // Vytvoríme notifikáciu
  const notification = new Notification(fakeMsg.name, {
    body: fakeMsg.text,
    icon: fakeMsg.avatar, // Avatar bude ako ikona
    badge: 'https://cdn-icons-png.flaticon.com/512/1384/1384069.png' // Iba príklad
  })

  // Po kliknutí na notifikáciu sa vráti fokus na appku
  notification.onclick = () => {
    window.focus()
  }
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    // Používateľ minimalizoval okno, naplánujeme notifikáciu
    notificationTimer = setTimeout(() => {
      showNotification()
    }, 3000) // Zobrazí sa po 3 sekundách
  } else {
    // Používateľ sa vrátil, zrušíme časovač
    if (notificationTimer) {
      clearTimeout(notificationTimer)
    }
  }
}

onMounted(() => {
  // Tvoja pôvodná logika pre scroll
  if (scrollArea.value) {
    scrollArea.value.scrollTop = scrollArea.value.scrollHeight
  }

  // --- NOVÉ (Cieľ 2): Pridanie listenera a žiadosť o povolenie ---
  // 1. Požiadame o povolenie, ak ešte nebolo udelené
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      notificationPermission.value = permission
    })
      .catch(err => { // <-- TOTO SI PRIDAJ

        // Ošetríme prípadnú chybu pri žiadaní o povolenie

        console.error('Chyba pri žiadaní o povolenie na notifikácie:', err)

      })
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
})

// --- NOVÉ (Cieľ 2): Upratanie listenera ---
onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  // Zrušíme časovač, ak by náhodou bežal pri odchode zo stránky
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
  overflow: hidden; /* 🔒 zabráni vonkajšiemu scrollu */
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

/* schovaj scrollbar */
.chat-scroll::-webkit-scrollbar {
  display: none;
}
.chat-scroll {
  scrollbar-width: none;
}

/* --- NOVÉ (Cieľ 1): Štýl pre zvýraznenú správu --- */
/* Poznámka: 'q-chat-message' je komplexný komponent.
  Zmena farby cez 'bg-color' prop je spoľahlivejšia
  ako snaha o prepísanie CSS cez 'border' alebo 'box-shadow',
  preto som to riešil cez funkciu getMessageColors().
  Nechávam to tu prázdne, aby bolo jasné, že CSS nie je potrebné.
*/
</style>
