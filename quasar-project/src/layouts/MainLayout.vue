<template>
  <q-layout view="lHh Lpr lFf">
    <!-- HEADER -->



    <!-- LEFT DRAWER -->
    <q-drawer v-model="leftDrawerOpen" show-if-above side="left" class="bg-orange-5 column">
      <div style="margin: 10px 15px">
        <img src="../assets/intouch-logo-name.svg" alt="logo" style="width: 100%; height: auto; margin-top: 10px" />
      </div>

      <div class="col q-pa-md bg-orange-2 drawer-div-wrapper" style="overflow-y: auto;">
        <q-list>
          <ChannelBar name="VPWA projekt"/>
          <ChannelBar name="Oznámenia"/>
          <ChannelBar name="Projekty"/>
          <ChannelBar name="Frontend"/>
          <ChannelBar name="Backend"/>
          <ChannelBar name="Databázy"/>
          <ChannelBar name="Bugy a chyby"/>
          <ChannelBar name="Testovanie"/>
          <ChannelBar name="Výskum"/>
          <ChannelBar name="Tím WTECH"/>
          <ChannelBar name="TímVPWA"/>
          <ChannelBar name="Návrhy"/>
          <ChannelBar name="Random"/>
          <ChannelBar name="Memes"/>
          <ChannelBar name="Off-topic"/>
          <ChannelBar name="Helpdesk"/>
          <ChannelBar name="Architektúra"/>

        </q-list>
      </div>

      <div class="q-pa-none bg-orange-2 drawer-div-wrapper" style="margin-top: 10px; padding: 2px">
        <q-item v-ripple>
          <q-item-section avatar>
            <q-avatar size="50px" color="white" text-color="grey-9">
              <q-badge floating color="red" rounded />
              S
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>Meno Používateľa</q-item-label>
            <q-item-label caption>Status/Rola</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              flat
              round
              dense
              color="black"
              icon="settings"
              size="lg"
              @click="$router.push('/app/settings')"
            />
          </q-item-section>

        </q-item>
      </div>
      <div style="height: 10px;" class="bg-primary" />
    </q-drawer>

    <!-- RIGHT DRAWER -->


    <!-- PAGE AREA -->
    <q-page-container class="bg-orange-3">
      <q-page class="q-pa-md">
        <router-view />
      </q-page>
    </q-page-container>


  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TextBar from 'src/components/TextBar.vue'
import ChannelBar from 'components/ChannelBar.vue'
import TopToolbar from 'components/TopToolbar.vue'

const leftDrawerOpen = ref(false)
const rightDrawerOpen = ref(false)

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
function toggleRightDrawer () {
  rightDrawerOpen.value = !rightDrawerOpen.value
}
</script>

<style>
.footer-wrapper {
  margin: 0.2cm;
  border-radius: 20px;
  overflow: hidden;
}
.full-width { width: 100%; }
.full-height { height: 100%; }

.drawer-div-wrapper {
  border-radius: 20px;
  margin: 0 10px;
}

/* status dots (ak ich budeš používať na avataroch) */
.status-dot {
  position: absolute;
  right: 5px;
  bottom: 5px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 2px solid #FEE7D7;
  z-index: 10;
}
.status-dot.online  { background-color: #4CAF50; }
.status-dot.offline { background-color: #F44336; }
.status-dot.away    { background-color: #9E9E9E; }
</style>
