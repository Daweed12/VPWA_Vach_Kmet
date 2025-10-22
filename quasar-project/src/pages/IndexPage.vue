<template>
  <q-header class="bg-orange-1 left-top-corner">
    <div style="height: 20px;" class="bg-primary" />
    <TopToolbar
      title="Conversation of channel"
      @toggle-left="toggleLeftDrawer"
      @toggle-right="toggleRightDrawer"
      @close="() => {}"
      @add-person="() => {}"
    />
  </q-header>
  <!-- FOOTER -->
  <q-footer class="bg-orange-1 footer-wrapper q-pa-none">
    <TextBar class="full-width full-height" />
  </q-footer>
</template>

<script setup lang="ts">
import TopToolbar from "components/TopToolbar.vue";
import {ref} from "vue";
import TextBar from "components/TextBar.vue";



const leftDrawerOpen = ref(false)
const rightDrawerOpen = ref(false)
function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
function toggleRightDrawer () {
  rightDrawerOpen.value = !rightDrawerOpen.value
}
</script>

<style scoped>

</style>
