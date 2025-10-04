<template>
  <q-layout view="lhh lpR lFr">

    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
          </q-avatar>
          Title
        </q-toolbar-title>

        <q-btn dense flat round icon="menu" @click="toggleRightDrawer" />
      </q-toolbar>
    </q-header>

    <!-- Left drawer -->
    <q-drawer show-if-above v-model="leftDrawerOpen" side="left">
      <!-- drawer content -->
    </q-drawer>

    <!-- Right drawer -->
    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered>
      <!-- drawer content -->
    </q-drawer>

    <q-page-container class="bg-orange-2">
      <router-view />
    </q-page-container>

    <q-footer class="bg-orange-1 text-black footer-wrapper q-pa-none">
          <text-bar class="full-width full-height"/>
    </q-footer>

  </q-layout>
</template>

<script lang="ts">
import { ref } from 'vue'
import textBar from 'src/components/TextBar.vue'

export default {
  components : {
    textBar
  },
  setup () {
    const leftDrawerOpen = ref(false)
    const rightDrawerOpen = ref(false)

    return {
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },

      rightDrawerOpen,
      toggleRightDrawer () {
        rightDrawerOpen.value = !rightDrawerOpen.value
      }
    }
  }
}
</script>

<style>
  .footer-wrapper {
    margin: 0.2cm 0.2cm 0.2cm 0.2cm; /* hore, pravo, dole, lavo */
    border-radius: 10px; /* zaoblené rohy */
    overflow: hidden; /* aby obsah footeru rešpektoval border-radius */
  }
  .full-width {
    width: 100%;
  }

  .full-height {
    height: 100%;
  }

</style>
