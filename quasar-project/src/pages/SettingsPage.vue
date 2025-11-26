<template>
  <q-page class="settings-page-wrapper">
    <UserSettings />
  </q-page>
</template>

<script setup lang="ts">
import UserSettings from 'src/components/UserSettings.vue'
</script>

<style scoped>
.settings-page-wrapper {
  /* Fix the height to available space */
  height: 100%;
  max-height: 100vh;

  /* Disable scroll on the wrapper, let the child component handle it */
  overflow: hidden !important;

  display: flex;
  flex-direction: column;
  padding: 0;
}
</style>
