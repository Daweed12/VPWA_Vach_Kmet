<template>
  <div class="q-pa-md">
    <div class="q-gutter-md" style="max-width: 300px">
      <q-input outlined v-model="text" label="Napíš správu..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const text = ref('')
</script>
