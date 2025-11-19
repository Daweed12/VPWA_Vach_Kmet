<template>
  <q-layout view="lhh lpR lFr" class="no-page-scroll">
    <!-- HORNÝ HEADER -->
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
          dense
          flat
          round
          icon="group"
          @click="toggleRightDrawer"
        />
      </q-toolbar>
    </q-header>

    <div class="column no-wrap test">
      <!-- ĽAVÝ DRAWER -->
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
              <!-- vyhľadávanie kanálov -->
              <ChannelSearchHeader v-model="channelSearch" />
            </div>

            <q-item-label header class="section-label">
              Invites
              <span
                v-if="invites.length"
                class="count-badge"
              >{{ invites.length }}</span>
            </q-item-label>

            <!-- INVITES -->
            <div v-if="invites.length">
              <channel
                v-for="ch in invites"
                :key="'invite-' + ch.id"
                :name="ch.title"
                :availability="ch.availability"
                is-invite
                @accept="() => handleAccept(ch)"
                @reject="() => handleReject(ch)"
              />
            </div>
            <div
              v-else
              class="text-grey-6 text-caption q-ml-sm q-mb-md"
            >
              Žiadne pozvánky
            </div>

            <q-separator spaced />

            <q-item-label header class="section-label">Channels</q-item-label>

            <!-- KANÁLY z API (filtrované) -->
            <channel
              v-for="ch in filteredChannels"
              :key="'ch-' + ch.id"
              :name="ch.title"
              :availability="ch.availability"
            />
          </q-list>
        </div>

        <!-- USER CARD DOLE -->
        <div
          class="q-pa-none bg-orange-2 drawer-div-wrapper"
          style="margin-top: 10px; padding: 2px"
        >
          <q-item v-ripple>
            <q-item-section avatar>
              <q-avatar size="56px" class="avatar-with-status">
                <img src="https://cdn.quasar.dev/img/avatar4.jpg" alt="EY">
                <div :class="['status-dot', statusDotClass]"></div>
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ currentUserName }}</q-item-label>
              <q-item-label caption>{{ currentUserStatus }}</q-item-label>
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

      <!-- MEMBER LIST VPRAVO -->
      <MemberList v-if="showRightDrawer" v-model="rightDrawerOpen" />

      <!-- HLAVNÁ STRANA -->
      <q-page-container class="bg-orange-3">
        <router-view />
      </q-page-container>
    </div>

    <!-- TEXTBAR DOLE -->
    <q-footer v-if="showComposer" class="bg-orange-1 footer-wrapper q-pa-sm">
      <text-bar class="full-width full-height" @send="onTextBarSend" />
    </q-footer>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import textBar from 'src/components/TextBar.vue'
import ChannelBar from 'components/ChannelBar.vue'
import ChannelSearchHeader from 'components/ChannelSearchHeader.vue'
import MemberList from 'components/MemberList.vue'
import { api } from 'boot/api'

interface ChannelFromApi {
  id: number
  title: string
  availability: string          // ⬅️ obyčajný string, nech sedí s ChannelBar prop
  creatorId: number
  createdAt: string
  lastMessageAt: string | null
}

interface CurrentUser {
  id: number
  email: string
  nickname: string
  firstname: string | null
  surname: string | null
  status: string | null
}

export default defineComponent({
  name: 'MainLayout',
  components: {
    ChannelSearchHeader,
    textBar,
    channel: ChannelBar,
    MemberList,
  },

  setup () {
    const route = useRoute()

    const leftDrawerOpen = ref(false)
    const rightDrawerOpen = ref(false)

    const invites = ref<ChannelFromApi[]>([
      {
        id: -1,
        title: 'Tajný projekt',
        availability: 'private',
        creatorId: 0,
        createdAt: new Date().toISOString(),
        lastMessageAt: null,
      },
      {
        id: -2,
        title: 'Skola memes',
        availability: 'private',
        creatorId: 0,
        createdAt: new Date().toISOString(),
        lastMessageAt: null,
      },
    ])

    const channels = ref<ChannelFromApi[]>([])
    const channelSearch = ref('')

    const currentUser = ref<CurrentUser | null>(null)

    const showComposer = computed(() => route.meta.showComposer === true)
    const showRightDrawer = computed(() => route.meta.showRightDrawer === true)
    const showHeader = computed(() => route.meta.showHeader !== false)

    function toggleLeftDrawer () {
      leftDrawerOpen.value = !leftDrawerOpen.value
    }

    function toggleRightDrawer () {
      rightDrawerOpen.value = !rightDrawerOpen.value
    }

    const handleAccept = (ch: ChannelFromApi) => {
      invites.value = invites.value.filter((i) => i.id !== ch.id)

      if (!channels.value.find((c) => c.id === ch.id)) {
        channels.value.unshift(ch)
      }
      console.log('Pozvánka prijatá:', ch.title)
    }

    const handleReject = (ch: ChannelFromApi) => {
      invites.value = invites.value.filter((i) => i.id !== ch.id)
      console.log('Pozvánka odmietnutá:', ch.title)
    }

    const onTextBarSend = (text: string) => {
      const cmd = text.trim().toLowerCase()
      if (cmd === '/list') {
        if (showRightDrawer.value) rightDrawerOpen.value = true
        return
      }
      console.log('Správa:', text)
    }

    const filteredChannels = computed(() => {
      const term = channelSearch.value.trim().toLowerCase()
      if (!term) return channels.value
      return channels.value.filter((ch) =>
        ch.title.toLowerCase().includes(term),
      )
    })

    const currentUserName = computed(() => {
      if (!currentUser.value) return 'Guest'
      const full = `${currentUser.value.firstname ?? ''} ${currentUser.value.surname ?? ''}`.trim()
      return full || currentUser.value.nickname || currentUser.value.email
    })

    const currentUserStatus = computed(
      () => currentUser.value?.status ?? 'online',
    )

    const statusDotClass = computed(() => {
      const status = (currentUser.value?.status ?? 'online').toLowerCase()
      switch (status) {
        case 'online':
          return 'bg-green'
        case 'away':
          return 'bg-amber'
        case 'dnd':
          return 'bg-red'
        case 'offline':
          return 'bg-grey-5'
        default:
          return 'bg-grey-5'
      }
    })

    const handleCurrentUserUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<CurrentUser>
      currentUser.value = customEvent.detail
    }

    onMounted(async () => {
      window.addEventListener(
        'currentUserUpdated',
        handleCurrentUserUpdated as EventListener,
      )

      // 1) najprv načítaj currentUser z localStorage
      try {
        const raw = localStorage.getItem('currentUser')
        if (raw) {
          currentUser.value = JSON.parse(raw) as CurrentUser
        }
      } catch (e) {
        console.error('Chyba pri čítaní currentUser z localStorage', e)
      }

      // 2) potom zavolaj /channels s userId
      try {
        const userId = currentUser.value?.id ?? null

        const { data } = await api.get<ChannelFromApi[]>('/channels', {
          params: { userId },
        })

        channels.value = data
      } catch (error) {
        console.error('Chyba pri načítaní kanálov z API', error)
      }
    })

    onUnmounted(() => {
      window.removeEventListener(
        'currentUserUpdated',
        handleCurrentUserUpdated as EventListener,
      )
    })

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
      filteredChannels,
      channelSearch,
      handleAccept,
      handleReject,
      onTextBarSend,
      currentUserName,
      currentUserStatus,
      statusDotClass,
    }
  },
})
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
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

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
  border: 4px solid #fef3c7;
  box-sizing: border-box;
}

.section-label {
  color: #8d6e63;
  text-transform: uppercase;
  letter-spacing: 0.06em;
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

html,
body,
#q-app {
  height: 100%;
}
</style>
