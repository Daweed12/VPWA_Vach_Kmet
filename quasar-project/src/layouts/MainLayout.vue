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
        <!-- ikona pre members len ak je na danej route povolený pravý drawer -->
        <q-btn
          v-if="showRightDrawer"
          dense flat round icon="group"
          @click="toggleRightDrawer"
        />
      </q-toolbar>
    </q-header>

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

        <!-- Channels -->
        <div class="col q-pa-md bg-orange-2 drawer-div-wrapper hide-scrollbar">
          <q-list>
            <!-- search -->
            <div class="q-mb-sm">
              <ChannelSearchHeader />
            </div>

            <!-- INVITES sekcia -->
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

            <!-- CHANNELS sekcia -->
            <q-item-label header class="section-label">Channels</q-item-label>

            <channel
              v-for="name in channels"
              :key="'ch-' + name"
              :name="name"
            />
          </q-list>
        </div>

        <!-- user row -->
        <div class="q-pa-none bg-orange-2 drawer-div-wrapper" style="margin-top: 10px; padding: 2px">
          <q-item v-ripple>
            <q-item-section avatar>
              <q-avatar size="50px" color="white" text-color="bg-gray-9">
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
        <div style="height: 10px;" class="bg-primary"></div>
      </q-drawer>

      <MemberList v-if="showRightDrawer" v-model="rightDrawerOpen" />

      <q-page-container class="bg-orange-3 q-page-container">
        <router-view />
      </q-page-container>
    </div>

    <!-- Dôležité: zachytávame @send z TextBar -->
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

    // DEMO dáta – tu si to neskôr napojíš na store/API
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

    // meta prepínače z routes.ts
    const showComposer = computed(() => route.meta.showComposer === true)
    const showRightDrawer = computed(() => route.meta.showRightDrawer === true)

    function toggleLeftDrawer () {
      leftDrawerOpen.value = !leftDrawerOpen.value
    }
    function toggleRightDrawer () {
      rightDrawerOpen.value = !rightDrawerOpen.value
    }

    // Handlery pre pozvánky (presun/odstránenie)
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
      // (voliteľné) iné správy: sem pošli do chatu/store
      console.log('Správa:', text)
    }

    return {
      leftDrawerOpen,
      rightDrawerOpen,
      showComposer,
      showRightDrawer,
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
.footer-wrapper {
  margin: 0.2cm;
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

.hide-scrollbar {
  overflow-y: auto;
  scrollbar-width: none;        /* Firefox */
  -ms-overflow-style: none;     /* Starý Edge / IE */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;                /* Chrome, Safari, Edge */
}

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

.status-dot.online { background-color: #4CAF50; }
.status-dot.offline { background-color: #F44336; }
.status-dot.away { background-color: #9E9E9E; }

.q-page-container { overflow: hidden !important; }
.test { height: 100vh; }

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
  background: #ffb74d; /* orange-4 */
  color: #4e342e;
}
</style>
