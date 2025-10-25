<template>
  <div class="text-bar q-pa-sm row items-center">
    <!-- Textové pole -->
    <q-input
      v-model="message"
      borderless
      placeholder="Napíš správu..."
      @keyup.enter="sendMessage"
      class="col"
    />

    <!-- Tlačidlo Odoslať -->
    <q-btn round color="primary" icon="send" class="q-ml-sm" @click="sendMessage" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'TextBar',
  emits: ['send'],
  setup(_, { emit }) {
    const message = ref('')

    const sendMessage = () => {
      if (message.value.trim() === '') return
      emit('send', message.value)
      message.value = ''
    }

    return {
      message,
      sendMessage
    }
  }
})
</script>

<style scoped>
.text-bar {
  width: 100%;
  padding-left: 0.5cm;
}
</style>
