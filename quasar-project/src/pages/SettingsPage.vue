<template>
  <!-- Stránka ne-scrolluje; celý scroll je vnútri UserSettings -->
  <q-page class="settings-page">
    <UserSettings />
  </q-page>
</template>

<script setup lang="ts">
import UserSettings from 'src/components/UserSettings.vue'
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;  /* žiadny page scroll */
  padding: 0;
}
</style>
