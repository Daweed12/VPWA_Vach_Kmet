<template>
  <div class="text-bar q-pa-sm row items-center">
    <!-- Textové pole -->
    <q-input
      ref="inputRef"
      v-model="message"
      borderless
      placeholder="Napíš správu..."
      @keyup.enter="sendMessage"
      class="col"
    />

    <!-- Emoji tlačidlo (rovnaká farba ako Send) -->
    <q-btn
      round
      color="primary"
      icon="emoji_emotions"
      class="q-ml-sm"
      aria-label="Otvoriť emoji"
    >
      <q-menu
        ref="emojiMenuRef"
        anchor="top right"
        self="bottom right"
        :offset="[0,8]"
        fit
      >
        <div class="q-pa-sm" style="max-width: 260px;">
          <div class="text-caption text-grey-7 q-mb-xs">Emoji</div>

          <!-- jednoduchý grid -->
          <div class="row q-col-gutter-xs">
            <div
              v-for="e in emojis"
              :key="e"
              class="col-2 flex flex-center"
            >
              <q-btn
                flat
                round
                dense
                class="emoji-btn"
                @click="addEmoji(e)"
              >
                <span class="text-h6">{{ e }}</span>
              </q-btn>
            </div>
          </div>
        </div>
      </q-menu>
    </q-btn>

    <!-- Tlačidlo Odoslať -->
    <q-btn
      round
      color="primary"
      icon="send"
      class="q-ml-sm"
      @click="sendMessage"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import type { QInput } from 'quasar'

export default defineComponent({
  name: 'TextBar',
  emits: ['send'],
  setup(_, { emit }) {
    const message = ref('')
    const inputRef = ref<QInput | null>(null)
    const emojiMenuRef = ref() // používame len .hide()

    const emojis = [
      '😀','😁','😂','🤣','😊','😍','😎','🤔','😅','🙃',
      '😉','😇','😭','😴','🤯','🥳','👍','👏','🙌','🔥',
      '🎉','💡','🚀','❤️','💪','🙏','👀','🤝','⚡','📷'
    ]

    const focusInput = () => {
      inputRef.value?.focus()
    }

    const addEmoji = (e: string) => {
      if (message.value && !/\s$/.test(message.value)) message.value += ' '
      message.value += e
      emojiMenuRef.value?.hide()
      // vrátime fokus do QInput – bez querySelector, bez type assertion
      setTimeout(focusInput, 0)
    }

    const sendMessage = () => {
      if (message.value.trim() === '') return
      emit('send', message.value)
      message.value = ''
      focusInput()
    }

    return {
      message,
      emojis,
      addEmoji,
      sendMessage,
      inputRef,
      emojiMenuRef
    }
  }
})
</script>

<style scoped>
.text-bar {
  width: 100%;
  padding-left: 0.5cm;
}

/* väčší klikací target pre emoji v gride */
.emoji-btn {
  width: 40px;
  height: 40px;
  line-height: 1;
}
</style>
