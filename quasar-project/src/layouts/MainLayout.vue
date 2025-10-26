<template>
  <q-layout view="lhh lpR lFr" class="no-page-scroll">
    <!-- Header -->
    <q-header v-if="showHeader" class="bg-orange-1 text-grey-9 left-top-corner">
      <div style="height: 20px;" class="bg-primary"></div>
      <q-toolbar>
        <q-toolbar-title>
          <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
          VPWA - projekt
        </q-toolbar-title>

        <q-btn dense flat round icon="close" />
        <q-btn dense flat round icon="person_add" />
        <q-btn
          v-if="showRightDrawer"
          dense flat round icon="group"
          @click="toggleRightDrawer"
        />
      </q-toolbar>
    </q-header>

    <!-- Left Drawer -->
    <div class="column no-wrap test">
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

        <div class="col q-pa-md bg-orange-2 drawer-div-wrapper hide-scrollbar">
          <q-list>
            <div class="q-mb-sm">
              <ChannelSearchHeader />
            </div>

            <q-item-label header class="section-label">
              Invites
              <span v-if="invites.length" class="count-badge">{{ invites.length }}</span>
            </q-item-label>

            <div v-if="invites.length">
              <channel
                v-for="name in invites"
                :key="'invite-' + name"
                :name="name"
                :is-invite="true"
                @accept="() => handleAccept(name)"
                @reject="() => handleReject(name)"
              />
            </div>
            <div v-else class="text-grey-6 text-caption q-ml-sm q-mb-md">
              Žiadne pozvánky
            </div>

            <q-separator spaced />

            <q-item-label header class="section-label">Channels</q-item-label>

            <channel
              v-for="name in channels"
              :key="'ch-' + name"
              :name="name"
            />
          </q-list>
        </div>

        <!-- User Info Section -->
        <div class="q-pa-none bg-orange-2 drawer-div-wrapper" style="margin-top: 10px; padding: 2px">
          <q-item v-ripple>
            <q-item-section avatar>
              <q-avatar size="56px" class="avatar-with-status">

                <img src="https://cdn.quasar.dev/img/avatar4.jpg" alt="EY">

                <div class="status-dot bg-green"></div>

              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>Eren Yager</q-item-label>
              <q-item-label caption>Online</q-item-label>
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
        <div style="height: 10px;" class="bg-primary"></div>
      </q-drawer>

      <MemberList v-if="showRightDrawer" v-model="rightDrawerOpen" />

      <q-page-container class="bg-orange-3">
        <router-view />
      </q-page-container>
    </div>

    <q-footer v-if="showComposer" class="bg-orange-1 footer-wrapper q-pa-sm">
      <text-bar class="full-width full-height" @send="onTextBarSend" />
    </q-footer>
  </q-layout>
</template>

<script lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import textBar from 'src/components/TextBar.vue'
import ChannelBar from 'components/ChannelBar.vue'
import ChannelSearchHeader from 'components/ChannelSearchHeader.vue'
import MemberList from 'components/MemberList.vue'

export default {
  components: {
    ChannelSearchHeader,
    textBar,
    channel: ChannelBar,
    MemberList
  },
  setup () {
    const leftDrawerOpen = ref(false)
    const rightDrawerOpen = ref(false)
    const route = useRoute()

    const invites = ref<string[]>(['Tajný projekt', 'Skola memes'])
    const channels = ref<string[]>([
      'VPWA - projekt',
      'WTECH - projekt',
      'Design',
      'Marketing',
      'Sales',
      'Support',
      'Random',
      'CEOs',
      'HR',
      'Finance',
      'Operations',
      'Product',
      'Customer Success',
      'IT',
      'Legal'
    ])

    const showComposer = computed(() => route.meta.showComposer === true)
    const showRightDrawer = computed(() => route.meta.showRightDrawer === true)
    const showHeader = computed(() => route.meta.showHeader !== false)

    function toggleLeftDrawer () { leftDrawerOpen.value = !leftDrawerOpen.value }
    function toggleRightDrawer () { rightDrawerOpen.value = !rightDrawerOpen.value }

    const handleAccept = (name: string) => {
      invites.value = invites.value.filter(n => n !== name)
      if (!channels.value.includes(name)) channels.value.unshift(name)
      console.log('Pozvánka prijatá:', name)
    }
    const handleReject = (name: string) => {
      invites.value = invites.value.filter(n => n !== name)
      console.log('Pozvánka odmietnutá:', name)
    }

    const onTextBarSend = (text: string) => {
      const cmd = text.trim().toLowerCase()
      if (cmd === '/list') {
        if (showRightDrawer.value) rightDrawerOpen.value = true
        return
      }
      console.log('Správa:', text)
    }

    return {
      leftDrawerOpen,
      rightDrawerOpen,
      showComposer,
      showRightDrawer,
      showHeader,
      toggleLeftDrawer,
      toggleRightDrawer,
      invites,
      channels,
      handleAccept,
      handleReject,
      onTextBarSend
    }
  }
}
</script>

<style>
.no-page-scroll,
.no-page-scroll .q-page-container,
.no-page-scroll .q-page {
  height: 100%;
  overflow: hidden;
}

.test {
  height: 100vh;
  overflow: hidden;
}
.footer-wrapper {
  margin: 0.2cm;
  border-radius: 20px;
}

.full-width { width: 100%; }
.full-height { height: 100%; }

.drawer-div-wrapper {
  border-radius: 20px;
  margin: 0 10px 0 10px;
}

.hide-scrollbar {
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hide-scrollbar::-webkit-scrollbar { display: none; }

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
.channel-item .q-item__section--main { font-size: 1.1em; }
.channel-item .q-item__section--side { padding-left: 10px; }

.avatar-with-status {
  position: relative;
}

.status-dot {
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 22px;
  height: 22px;
  border-radius: 50%;

  /* Voliteľné: Okraj, ktorý oddelí bodku od fotky.
    Farba by mala zodpovedať pozadiu, na ktorom je avatar umiestnený.
    V tvojom screenshote je to tmavo-sivá. Pre demo použijem bielu.
  */
  border: 4px solid #fef3c7;

  /* Zabezpečí, aby bola bodka pekne centrovaná, ak by mala okraj */
  box-sizing: border-box;
}

/* Sekčné hlavičky */
.section-label {
  color: #8d6e63;
  text-transform: uppercase;
  letter-spacing: .06em;
  display: flex;
  align-items: center;
  gap: 6px;
}
.count-badge {
  font-size: 11px;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 10px;
  background: #ffb74d;
  color: #4e342e;
}

html, body, #q-app { height: 100%; }
</style>
