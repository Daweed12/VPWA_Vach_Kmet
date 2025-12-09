<template>
  <div class="text-bar q-pa-sm row items-center">
    <q-input
      ref="inputRef"
      v-model="message"
      borderless
      placeholder="Napíš správu..."
      @keyup.enter="sendMessage"
      @input="handleTyping"
      @keydown="handleTyping"
      class="col"
    />
    <q-btn round color="primary" icon="emoji_emotions" class="q-ml-sm" aria-label="Otvoriť emoji">
      <q-menu ref="emojiMenuRef" anchor="top right" self="bottom right" :offset="[0, 8]" fit>
        <div class="q-pa-sm" style="max-width: 260px">
          <div class="text-caption text-grey-7 q-mb-xs">Emoji</div>
          <div class="row q-col-gutter-xs">
            <div v-for="e in emojis" :key="e" class="col-2 flex flex-center">
              <q-btn flat round dense class="emoji-btn" @click="addEmoji(e)">
                <span class="text-h6">{{ e }}</span>
              </q-btn>
            </div>
          </div>
        </div>
      </q-menu>
    </q-btn>

    <q-btn round color="primary" icon="send" class="q-ml-sm" @click="sendMessage" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import type { QInput } from 'quasar';

export default defineComponent({
  name: 'TextBar',
  emits: ['send', 'typing'],
  setup(_, { emit }) {
    const message = ref('');
    const inputRef = ref<QInput | null>(null);
    const emojiMenuRef = ref();

    let typingTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastTypingEmit = 0;

    const emojis = [
      '😀',
      '😁',
      '😂',
      '🤣',
      '😊',
      '😍',
      '😎',
      '🤔',
      '😅',
      '🙃',
      '😉',
      '😇',
      '😭',
      '😴',
      '🤯',
      '🥳',
      '👍',
      '👏',
      '🙌',
      '🔥',
      '🎉',
      '💡',
      '🚀',
      '❤️',
      '💪',
      '🙏',
      '👀',
      '🤝',
      '⚡',
      '📷',
    ];

    const focusInput = () => {
      inputRef.value?.focus();
    };

    const addEmoji = (e: string) => {
      if (message.value && !/\s$/.test(message.value)) message.value += ' ';
      message.value += e;
      emojiMenuRef.value?.hide();
      setTimeout(focusInput, 0);
      handleTyping();
    };

    const handleTyping = () => {
      const now = Date.now();
      // Throttle typing events to max once per 200ms for real-time feel
      if (now - lastTypingEmit < 200) return;
      lastTypingEmit = now;

      // Emit typing with current message content
      emit('typing', true, message.value);

      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeout = setTimeout(() => {
        emit('typing', false);
        typingTimeout = null;
      }, 2000);
    };

    const sendMessage = () => {
      if (message.value.trim() === '') return;

      // Stop typing indicator
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
      }
      emit('typing', false);

      emit('send', message.value);
      message.value = '';
      focusInput();
    };

    return {
      message,
      emojis,
      addEmoji,
      sendMessage,
      handleTyping,
      inputRef,
      emojiMenuRef,
    };
  },
});
</script>

<style scoped>
.text-bar {
  width: 100%;
  padding-left: 0.5cm;
}

.emoji-btn {
  width: 40px;
  height: 40px;
  line-height: 1;
}
</style>
