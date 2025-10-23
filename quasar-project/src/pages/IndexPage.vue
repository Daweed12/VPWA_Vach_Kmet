<template>
  <q-page class="bg-orange-3">
    <div
      class="chat-container"
    >
      <div
        ref="scrollArea"
        id="chat-scroll"
        class="chat-scroll"
      >
        <q-infinite-scroll
          reverse
          @load="loadOlder"
          :offset="100"
          scroll-target="#chat-scroll"
        >
          <q-list separator>
            <q-item
              v-for="(msg, index) in visibleMessages"
              :key="index"
              class="q-pa-none q-mb-sm justify-start"
            >
              <div
                :class="msg.from === 'me' ? 'bg-grey-3' : 'bg-blue-2'"
                class="q-pa-sm rounded-borders text-left shadow-sm"
                style="max-width: 85%;"
              >
                {{ msg.text }}
              </div>
            </q-item>
          </q-list>

          <template #loading>
            <div class="text-grey q-my-md">
              <q-spinner-dots size="40px" color="primary" />
            </div>
          </template>
        </q-infinite-scroll>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const allMessages = [
  { from: 'you', text: 'Ahoj, ako sa máš? Už si videl dnešné správy?' },
  { from: 'me', text: 'Ahoj, mám sa fajn. Ešte som ich nepozeral, čo sa deje?' },
  { from: 'you', text: 'Nič dôležité, len bežné veci. Ale počul som, že počasie má byť cez víkend super!' },
  { from: 'me', text: 'To znie skvele! Plánuješ niečo?' },
  { from: 'you', text: 'Možno výlet do hôr, ak nebude pršať.' },
  { from: 'me', text: 'To znie super! Zober si aj foťák.' },
  { from: 'you', text: 'Jasné, mám v pláne spraviť pár fotiek.' },
  { from: 'me', text: 'Teším sa, pošli mi potom niečo.' },
  { from: 'you', text: 'Určite! 😊' },
  { from: 'me', text: 'Super, držím palce s počasím!' },
  { from: 'you', text: 'Díky! 😉' },
  { from: 'me', text: 'Vidíme sa v pondelok!' }
]

const step = 4
const visibleMessages = ref(allMessages.slice(-step))
const scrollArea = ref<HTMLElement | null>(null)

function loadOlder(index: number, done: Function) {
  setTimeout(() => {
    const currentCount = visibleMessages.value.length
    const newCount = currentCount + step
    const newStart = Math.max(allMessages.length - newCount, 0)
    visibleMessages.value = allMessages.slice(newStart)

    if (newStart === 0) done(true)
    else done()
  }, 400)
}

onMounted(() => {
  if (scrollArea.value) {
    scrollArea.value.scrollTop = scrollArea.value.scrollHeight
  }
})
</script>

<style scoped>
.chat-container {
  width: 100%;
  max-width: 100%;
  height: 80vh; /* 🧱 na celý obdĺžnik */
  display: flex;
  flex-direction: column;
  background-color: #ffcc80;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0,0,0,0.2);
}

/* 🧭 Scrollovacia časť */
.chat-scroll {
  flex: 1;
  overflow-y: scroll;
  display: flex;
  flex-direction: column-reverse;
  padding: 16px;
}

/* 💨 Skryj scrollbar pre všetky prehliadače */
.chat-scroll::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.chat-scroll {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE a Edge */
}
</style>
