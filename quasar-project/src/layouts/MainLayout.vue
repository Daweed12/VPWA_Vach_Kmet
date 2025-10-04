<template>
  <q-layout view="lhh lpR lFr">
    <q-header class="bg-orange-1 text-grey-9 left-top-corner">
      <div style="height: 20px;" class = "bg-primary"></div>
      <q-toolbar>
        <q-toolbar-title>
          <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
          Channel name
        </q-toolbar-title>

        <q-btn dense flat round icon="menu" @click="toggleRightDrawer" />
      </q-toolbar>
    </q-header>

    <!-- Left drawer -->
    <q-drawer
      show-if-above
      v-model="leftDrawerOpen"
      side="left"
      class="bg-orange-5 column"
    >
      <div style="margin: 10px 15px 10px 15px;">
        <img src="../assets/intouch-logo-name.svg" alt="logo" style="width: 100%; height: auto; margin-top: 10px" />
      </div>

      <!-- Channels -->
      <div class="col q-pa-md bg-orange-2 drawer-div-wrapper" style="overflow-y: auto;">
        <p>Obsah drawera - Zoznam channelov</p>
      </div>

      <div class="q-pa-none bg-orange-2 drawer-div-wrapper" style="margin-top: 10px; padding: 2px">
        <q-item clickable v-ripple>
          <q-item-section avatar>
            <q-avatar size="50px" color="blue" text-color="white">
              S
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>Meno Používateľa</q-item-label>
            <q-item-label caption>Status/Rola</q-item-label>
          </q-item-section>
        </q-item>
      </div>
      <div style="height: 10px;" class = "bg-primary"></div>
    </q-drawer>

    <!-- Right drawer -->
    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered>
    </q-drawer>

    <q-page-container class="bg-orange-3 left-top-corner">
      <router-view />
    </q-page-container>

    <q-footer class="bg-orange-1 footer-wrapper q-pa-none">
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
    border-radius: 20px; /* zaoblené rohy */
    overflow: hidden; /* aby obsah footeru rešpektoval border-radius */
  }
  .full-width {
    width: 100%;
  }

  .full-height {
    height: 100%;
  }

  .drawer-div-wrapper{
    border-radius: 20px;
    margin: 0 10px 0 10px;
  }

</style>
