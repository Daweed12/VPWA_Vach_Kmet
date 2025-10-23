<template>
  <q-layout view="lhh lpR lFr">
    <q-header class="bg-orange-1 text-grey-9 left-top-corner">
      <div style="height: 20px;" class="bg-primary"></div>
      <q-toolbar>
        <q-toolbar-title>
          <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
          VPWA - projekt
        </q-toolbar-title>
        <q-btn dense flat round icon="close" />
        <q-btn dense flat round icon="person_add" />
        <q-btn dense flat round icon="group" @click="toggleRightDrawer" />
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
        <img
          src="../assets/intouch-logo-name.svg"
          alt="logo"
          style="width: 100%; height: auto; margin-top: 10px"
        />
      </div>

      <!-- Channels -->
      <div class="col q-pa-md bg-orange-2 drawer-div-wrapper hide-scrollbar">
        <q-list>
          <div>
            <ChannelSearchHeader></ChannelSearchHeader>
          </div>
          <channel name="VPWA - projekt" />
          <channel name="Development" />
          <channel name="Design" />
          <channel name="Marketing" />
          <channel name="Sales" />
          <channel name="Support" />
          <channel name="Random" />
          <channel name="Announcements" />
          <channel name="HR" />
          <channel name="Finance" />
          <channel name="Operations" />
          <channel name="Product" />
          <channel name="Customer Success" />
          <channel name="IT" />
          <channel name="Legal" />
        </q-list>
      </div>

      <div class="q-pa-none bg-orange-2 drawer-div-wrapper" style="margin-top: 10px; padding: 2px">
        <q-item v-ripple>
          <q-item-section avatar>
            <q-avatar size="50px" color="white" text-color="bg-gray-9">
              <q-badge floating color="red" rounded />S
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
              @click="$router.push('/settings')"
            />
          </q-item-section>
        </q-item>
      </div>
      <div style="height: 10px;" class="bg-primary"></div>
    </q-drawer>

    <!-- ✅ Right drawer – tu používame MemberList -->
    <MemberList v-model="rightDrawerOpen" />

    <q-page-container class="bg-orange-3">
      <router-view />
    </q-page-container>

    <q-footer class="bg-orange-1 footer-wrapper q-pa-none">
      <text-bar class="full-width full-height" />
    </q-footer>
  </q-layout>
</template>

<script lang="ts">
import { ref } from 'vue'
import textBar from 'src/components/TextBar.vue'
import ChannelBar from 'components/ChannelBar.vue'
import ChannelSearchHeader from "components/ChannelSearchHeader.vue";
import MemberList from "components/MemberList.vue";

export default {
  components: {
    ChannelSearchHeader,
    textBar,
    channel: ChannelBar,
    MemberList
  },
  setup() {
    const leftDrawerOpen = ref(false)
    const rightDrawerOpen = ref(false)

    return {
      leftDrawerOpen,
      rightDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },
      toggleRightDrawer() {
        rightDrawerOpen.value = !rightDrawerOpen.value
      }
    }
  }
}
</script>

<style>
.footer-wrapper {
  margin: 0.2cm 0.2cm 0.2cm 0.2cm;
  border-radius: 20px;
  overflow: hidden;
}

.full-width {
  width: 100%;
}

.full-height {
  height: 100%;
}

.drawer-div-wrapper {
  border-radius: 20px;
  margin: 0 10px 0 10px;
}

/* === SKRYTÝ SCROLLBAR === */
.hide-scrollbar {
  overflow-y: auto;
  scrollbar-width: none;        /* Firefox */
  -ms-overflow-style: none;     /* Starý Edge / IE */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;                /* Chrome, Safari, Edge */
}

/* === CHANNEL ITEMS === */
.channel-item {
  border-radius: 15px;
  min-height: 50px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
}

.channel-item .q-item__section--main {
  font-size: 1.1em;
}

.channel-item .q-item__section--side {
  padding-left: 10px;
}

/* === STATUS DOTS === */
.status-dot {
  position: absolute;
  top: auto;
  right: 5px;
  bottom: 5px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 2px solid #FEE7D7;
  z-index: 10;
}

.status-dot.online {
  background-color: #4CAF50;
}

.status-dot.offline {
  background-color: #F44336;
}

.status-dot.away {
  background-color: #9E9E9E;
}
</style>
