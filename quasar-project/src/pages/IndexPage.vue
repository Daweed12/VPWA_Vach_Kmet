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
              :bg-color="msg.from === 'me' ? 'primary' : 'grey-3'"
              :text-color="msg.from === 'me' ? 'white' : 'black'"
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
import { ref, onMounted } from 'vue'

interface Message {
  from: string;
  name: string;
  avatar: string;
  text: string;
}

const me = { id: 'me', name: 'Ja', avatar: 'https://cdn.quasar.dev/img/avatar3.jpg' }
const jane = { id: 'jane', name: 'Jane', avatar: 'https://cdn.quasar.dev/img/avatar5.jpg' }

const allMessages: Message[] = Array.from({ length: 30 }).map((_, i) => ({
  from: i % 2 === 0 ? jane.id : me.id,
  name: i % 2 === 0 ? jane.name : me.name,
  avatar: i % 2 === 0 ? jane.avatar : me.avatar,
  text: i % 2 === 0 ? 'Ahoj, ako sa máš?' : 'Mám sa fajn, a ty?'
}))

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

onMounted(() => {
  if (scrollArea.value) {
    scrollArea.value.scrollTop = scrollArea.value.scrollHeight
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
  overflow-y: auto; /* ✅ scroll len tu */
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
</style>
