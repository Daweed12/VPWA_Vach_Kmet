<template>
  <q-layout view="lhh lpR lFr" class="no-page-scroll">
    <!-- HLAVNÝ HEADER -->
    <q-header v-if="showHeader" class="bg-orange-1 text-grey-9 left-top-corner">
      <div style="height: 20px;" class="bg-primary"></div>

      <q-toolbar>
        <q-toolbar-title>
          <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

          <!-- Názov podľa toho, či som v settings alebo v app -->
          <span v-if="isSettingsPage">
            Nastavenia používateľského účtu
          </span>
          <span v-else-if="currentChannelTitle">
            {{ currentChannelTitle }}
          </span>
          <span v-else>
            VPWA - projekt
          </span>
        </q-toolbar-title>

        <!-- Ikonky vpravo – len mimo settings -->
        <template v-if="!isSettingsPage">
          <q-btn dense flat round icon="close" />
          <q-btn dense flat round icon="person_add" />
          <q-btn
            dense flat round
            icon="group"
            @click="toggleRightDrawer"
          />
        </template>

      </q-toolbar>
    </q-header>

    <!-- HLAVNÉ TELO -->
    <div class="column no-wrap test">
      <!-- ĽAVÝ PANEL -->
      <q-drawer
        show-if-above
        v-model="leftDrawerOpen"
        side="left"
        class="bg-orange-5 column"
      >
        <!-- LOGO -->
        <div style="margin: 10px 15px 10px 15px;">
          <img
            src="../assets/intouch-logo-name.svg"
            alt="logo"
            style="width: 100%; height: auto; margin-top: 10px"
          />
        </div>

        <!-- MIDDLE PANEL -->
        <div class="col q-pa-md bg-orange-2 drawer-div-wrapper hide-scrollbar">
          <q-list>
            <div class="q-mb-sm">
              <ChannelSearchHeader v-model="channelSearch" />
            </div>

            <!-- INVITES -->
            <q-item-label header class="section-label">
              Invites
              <span v-if="invites.length" class="count-badge">
                {{ invites.length }}
              </span>
            </q-item-label>

            <div v-if="invites.length">
              <channel
                v-for="inv in invites"
                :key="'invite-' + inv.id"
                :name="inv.title"
                :availability="inv.availability"
                :is-invite="true"
                @accept="() => handleAccept(inv)"
                @reject="() => handleReject(inv)"
              />
            </div>

            <div v-else class="text-grey-6 text-caption q-ml-sm q-mb-md">
              Žiadne pozvánky
            </div>

            <q-separator spaced />

            <!-- CHANNELS -->
            <q-item-label header class="section-label">
              Channels
              <span v-if="filteredChannels.length" class="count-badge">
                {{ filteredChannels.length }}
              </span>
            </q-item-label>

            <channel
              v-for="ch in filteredChannels"
              :key="'ch-' + ch.id"
              :name="ch.title"
              :availability="ch.availability"
              @click="() => handleChannelClick(ch)"
            />
          </q-list>
        </div>

        <!-- USER BADGE DOLE -->
        <div
          class="q-pa-none bg-orange-2 drawer-div-wrapper"
          style="margin-top: 10px; padding: 2px"
        >
          <q-item v-ripple>
            <q-item-section avatar>
              <q-avatar size="56px" class="avatar-with-status">
                <img :src="currentUserAvatar" alt="avatar" />
                <div class="status-dot" :class="statusDotClass"></div>
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

      <!-- RIGHT SIDEBAR -->
      <!-- RIGHT SIDEBAR -->
      <MemberList v-model="rightDrawerOpen" />


      <!-- MAIN VIEW -->
      <q-page-container class="bg-orange-3">
        <router-view />
      </q-page-container>
    </div>

    <!-- TEXTBAR DOLE – len mimo settings -->
    <q-footer v-if="!isSettingsPage" class="bg-orange-1 footer-wrapper q-pa-sm">
      <text-bar class="full-width full-height" @send="onTextBarSend" />
    </q-footer>

  </q-layout>
</template>

<script lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import textBar from 'src/components/TextBar.vue'
import ChannelBar from 'components/ChannelBar.vue'
import ChannelSearchHeader from 'components/ChannelSearchHeader.vue'
import MemberList from 'components/MemberList.vue'
import { api } from 'boot/api'

interface ChannelFromApi {
  id: number
  title: string
  availability: string
  creatorId?: number
  createdAt?: string
  lastMessageAt?: string | null
}

interface InviteFromApi {
  id: number
  channelId: number
  title: string
  availability: string
  inviterId: number
  createdAt: string
}

interface CurrentUser {
  id: number
  email: string
  nickname: string
  firstname: string | null
  surname: string | null
  status: string | null
  profilePicture: string | null
}

export default {
  components: {
    ChannelSearchHeader,
    textBar,
    channel: ChannelBar,
    MemberList,
  },

  setup () {
    const leftDrawerOpen = ref(false)
    const rightDrawerOpen = ref(false)

    const route = useRoute()

    const invites = ref<InviteFromApi[]>([])
    const channels = ref<ChannelFromApi[]>([])
    const channelSearch = ref('')

    const currentChannelTitle = ref<string | null>(null)
    const currentUser = ref<CurrentUser | null>(null)

    const showComposer = computed(() => route.meta.showComposer === true)
    const showRightDrawer = computed(() => route.meta.showRightDrawer === true)
    const showHeader = computed(() => route.meta.showHeader !== false)

    // 👉 sme na /app/settings ?
    const isSettingsPage = computed(() => route.path.startsWith('/app/settings'))

    function toggleLeftDrawer () {
      leftDrawerOpen.value = !leftDrawerOpen.value
    }

    function toggleRightDrawer () {
      rightDrawerOpen.value = !rightDrawerOpen.value
    }

    const handleAccept = async (inv: InviteFromApi) => {
      await api.post(`/invites/${inv.id}/accept`)
      invites.value = invites.value.filter((i) => i.id !== inv.id)

      if (!channels.value.find((c) => c.id === inv.channelId)) {
        channels.value.unshift({
          id: inv.channelId,
          title: inv.title,
          availability: inv.availability,
        })
      }
    }

    const handleReject = async (inv: InviteFromApi) => {
      await api.post(`/invites/${inv.id}/reject`)
      invites.value = invites.value.filter((i) => i.id !== inv.id)
    }

    const handleChannelClick = (ch: ChannelFromApi) => {
      currentChannelTitle.value = ch.title

      window.dispatchEvent(
        new CustomEvent('channelSelected', {
          detail: {
            id: ch.id,
            title: ch.title,
          },
        }),
      )
    }

    const filteredChannels = computed(() => {
      const term = channelSearch.value.trim().toLowerCase()
      if (!term) return channels.value
      return channels.value.filter((c) =>
        c.title.toLowerCase().includes(term),
      )
    })

    const currentUserName = computed(() => {
      if (!currentUser.value) return 'User'
      return (
        `${currentUser.value.firstname ?? ''} ${currentUser.value.surname ?? ''}`.trim() ||
        currentUser.value.nickname ||
        currentUser.value.email
      )
    })

    const currentUserAvatar = computed(
      () =>
        currentUser.value?.profilePicture ||
        'https://cdn.quasar.dev/img/avatar4.jpg',
    )

    const currentUserStatus = computed(
      () => currentUser.value?.status ?? 'online',
    )

    const statusDotClass = computed(() => {
      const status = (currentUser.value?.status ?? 'online').toLowerCase()
      return {
        'bg-green': status === 'online',
        'bg-amber': status === 'away',
        'bg-red': status === 'dnd',
        'bg-grey': status === 'offline',
      }
    })

    onMounted(async () => {
      const stored = localStorage.getItem('currentUser')
      if (stored) currentUser.value = JSON.parse(stored)

      const userId = currentUser.value?.id

      const chRes = await api.get('/channels', { params: { userId } })
      channels.value = chRes.data

      const invRes = await api.get('/invites', { params: { userId } })
      invites.value = invRes.data
    })

    const onTextBarSend = (text: string) => {
      const cmd = text.trim().toLowerCase()
      if (cmd === '/list') {
        rightDrawerOpen.value = true
        return
      }
      console.log('Správa:', text)
    }

    return {
      leftDrawerOpen,
      rightDrawerOpen,
      toggleLeftDrawer,
      toggleRightDrawer,

      invites,
      channels,
      filteredChannels,
      channelSearch,
      currentChannelTitle,

      showComposer,
      showRightDrawer,
      showHeader,
      isSettingsPage,

      handleAccept,
      handleReject,
      handleChannelClick,

      currentUserName,
      currentUserAvatar,
      currentUserStatus,
      statusDotClass,

      onTextBarSend,
    }
  },
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
