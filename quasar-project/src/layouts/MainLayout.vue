<template>
  <q-layout view="lhh lpR lFr" class="no-page-scroll">
    <!-- HEADER -->
    <q-header v-if="showHeader" class="bg-orange-1 text-grey-9 left-top-corner">
      <div style="height: 20px;" class="bg-primary" />

      <q-toolbar>
        <q-toolbar-title>
          <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

          <!-- Titulok podľa stránky -->
          <span v-if="isSettingsPage">
            Nastavenia používateľského účtu
          </span>
          <span v-else-if="currentChannelTitle">
            # {{ currentChannelTitle }}
          </span>
          <span v-else>
            VPWA - projekt
          </span>
        </q-toolbar-title>

        <!-- Ikonky vpravo – len mimo settings -->
        <template v-if="!isSettingsPage">
          <!-- X len ak som owner daného kanála -->
          <q-btn
            v-if="canDeleteCurrentChannel"
            dense
            flat
            round
            icon="close"
            :disable="deletingChannel"
            @click="onDeleteCurrentChannel"
          />
          <q-btn dense flat round icon="person_add" />
          <q-btn
            dense
            flat
            round
            icon="group"
            @click="toggleRightDrawer"
          />
        </template>
      </q-toolbar>
    </q-header>

    <!-- TELO -->
    <div class="column no-wrap test">
      <!-- ĽAVÝ SIDEBAR -->
      <q-drawer
        show-if-above
        v-model="leftDrawerOpen"
        side="left"
        class="bg-orange-5 column"
      >
        <!-- Logo -->
        <div 
          style="margin: 10px 15px 10px 15px; cursor: pointer;"
          @click="navigateHome"
        >
          <img
            src="../assets/intouch-logo-name.svg"
            alt="logo"
            style="width: 100%; height: auto; margin-top: 10px"
          />
        </div>

        <!-- Invites + Channels -->
        <div class="col q-pa-md bg-orange-2 drawer-div-wrapper hide-scrollbar">
          <q-list>
            <div class="q-mb-sm">
              <ChannelSearchHeader
                v-model="channelSearch"
                @create-channel="openCreateChannelDialog"
              />
            </div>

            <!-- INVITES -->
            <q-item-label header class="section-label">
              Invites
              <span
                v-if="invites.length"
                class="count-badge"
              >
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
            <div
              v-else
              class="text-grey-6 text-caption q-ml-sm q-mb-md"
            >
              Žiadne pozvánky
            </div>

            <q-separator spaced />

            <!-- CHANNELS -->
            <q-item-label header class="section-label">
              Channels
              <span
                v-if="filteredChannels.length"
                class="count-badge"
              >
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
                <div class="status-dot" :class="statusDotClass" />
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

        <div style="height: 10px;" class="bg-primary" />
      </q-drawer>

      <!-- PRAVÝ SIDEBAR (MemberList) – len mimo settings -->
      <MemberList
        v-if="!isSettingsPage"
        v-model="rightDrawerOpen"
        :channel-id="currentChannel?.id ?? null"
        :inviter-id="currentUser?.id ?? null"
        :current-user-status="currentUser?.status ?? null"
        :current-user-id="currentUser?.id ?? null"
        :channel-availability="currentChannel?.availability ?? null"
        :is-channel-owner="canDeleteCurrentChannel"
      />

      <!-- HLAVNÝ OBSAH -->
      <q-page-container class="bg-orange-3">
        <router-view />
      </q-page-container>
    </div>

    <!-- TEXTBAR – vždy na /app, okrem /app/settings -->
    <q-footer
      v-if="showComposer"
      class="bg-orange-1 footer-wrapper q-pa-sm"
    >
      <text-bar
        class="full-width full-height"
        @send="onTextBarSend"
      />
    </q-footer>

    <!-- DIALOG: Vytvoriť nový kanál -->
    <q-dialog v-model="createDialogOpen" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Vytvoriť nový kanál</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Budeš nastavený ako vlastník kanála.
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-md">
          <q-input
            v-model="newChannelTitle"
            label="Názov kanála"
            autofocus
            :rules="[
              (val) =>
                (!!val && val.trim().length >= 3) || 'Min. 3 znaky'
            ]"
          />

          <q-option-group
            v-model="newChannelAvailability"
            type="radio"
            :options="[
              { label: 'Verejný (public)', value: 'public' },
              { label: 'Súkromný (private)', value: 'private' }
            ]"
            inline
          />

          <div
            v-if="createChannelError"
            class="text-negative text-caption"
          >
            {{ createChannelError }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Zrušiť"
            color="grey"
            @click="closeCreateDialog"
          />
          <q-btn
            unelevated
            color="orange-7"
            :loading="creatingChannel"
            :disable="creatingChannel"
            label="Vytvoriť"
            @click="onCreateChannelConfirm"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
    MemberList
  },

  setup () {
    const leftDrawerOpen = ref(true)
    const rightDrawerOpen = ref(false)

    const route = useRoute()
    const router = useRouter()

    const invites = ref<InviteFromApi[]>([])
    const channels = ref<ChannelFromApi[]>([])
    const channelSearch = ref('')

    const currentChannelTitle = ref<string | null>(null)
    const currentChannel = ref<ChannelFromApi | null>(null)
    const currentUser = ref<CurrentUser | null>(null)

    const showHeader = computed(() => route.meta.showHeader !== false)
    const isSettingsPage = computed(() => route.path.startsWith('/app/settings'))

    // TextBar: vždy na /app, okrem settings
    const showComposer = computed(() => !isSettingsPage.value)

    // CREATE CHANNEL dialog state
    const createDialogOpen = ref(false)
    const newChannelTitle = ref('')
    const newChannelAvailability = ref<'public' | 'private'>('public')
    const creatingChannel = ref(false)
    const createChannelError = ref('')

    // DELETE CHANNEL stav
    const deletingChannel = ref(false)

    // či je current user owner aktuálneho kanála
    const canDeleteCurrentChannel = computed(() => {
      if (!currentUser.value || !currentChannel.value) return false
      return currentChannel.value.creatorId === currentUser.value.id
    })

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
          availability: inv.availability
        })
      }
    }

    const handleReject = async (inv: InviteFromApi) => {
      await api.post(`/invites/${inv.id}/reject`)
      invites.value = invites.value.filter((i) => i.id !== inv.id)
    }

    const handleChannelClick = (ch: ChannelFromApi) => {
      currentChannelTitle.value = ch.title
      currentChannel.value = ch

      window.dispatchEvent(
        new CustomEvent('channelSelected', {
          detail: {
            id: ch.id,
            title: ch.title
          }
        })
      )
    }

    const filteredChannels = computed(() => {
      const term = channelSearch.value.trim().toLowerCase()
      if (!term) return channels.value
      return channels.value.filter((c) =>
        c.title.toLowerCase().includes(term)
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
        'https://cdn.quasar.dev/img/avatar4.jpg'
    )

    const currentUserStatus = computed(
      () => currentUser.value?.status ?? 'online'
    )

    const statusDotClass = computed(() => {
      const status = (currentUser.value?.status ?? 'online').toLowerCase()
      return {
        'bg-green': status === 'online',
        'bg-amber': status === 'away',
        'bg-red': status === 'dnd',
        'bg-grey': status === 'offline'
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

      // Listen for currentUser updates from Settings page
      const handleUserUpdate = (event: Event) => {
        const customEvent = event as CustomEvent<CurrentUser>
        if (customEvent.detail) {
          currentUser.value = customEvent.detail
          localStorage.setItem('currentUser', JSON.stringify(customEvent.detail))
        }
      }

      window.addEventListener('currentUserUpdated', handleUserUpdate)

      // Cleanup on unmount
      return () => {
        window.removeEventListener('currentUserUpdated', handleUserUpdate)
      }
    })

    const onTextBarSend = (text: string) => {
      const cmd = text.trim().toLowerCase()
      if (cmd === '/list') {
        rightDrawerOpen.value = true
        return
      }
      console.log('Správa:', text)
    }

    // CREATE CHANNEL handlers
    function openCreateChannelDialog () {
      if (!currentUser.value) {
        window.alert('Najprv sa prihlás ako používateľ.')
        return
      }
      createChannelError.value = ''
      newChannelTitle.value = ''
      newChannelAvailability.value = 'public'
      createDialogOpen.value = true
    }

    function closeCreateDialog () {
      if (creatingChannel.value) return
      createDialogOpen.value = false
    }

    const onCreateChannelConfirm = async () => {
      if (!currentUser.value) {
        createChannelError.value = 'Nie si prihlásený.'
        return
      }

      const title = newChannelTitle.value.trim()
      if (title.length < 3) {
        createChannelError.value = 'Názov musí mať aspoň 3 znaky.'
        return
      }

      // kontrola duplicit – case-insensitive
      const lower = title.toLowerCase()
      if (channels.value.some(c => c.title.trim().toLowerCase() === lower)) {
        createChannelError.value = 'Kanál s týmto názvom už existuje.'
        return
      }

      creatingChannel.value = true
      createChannelError.value = ''

      try {
        const payload = {
          title,
          availability: newChannelAvailability.value,
          creatorId: currentUser.value.id
        }

        const res = await api.post('/channels', payload)
        const created = res.data as ChannelFromApi

        channels.value.unshift(created)
        handleChannelClick(created)

        createDialogOpen.value = false
      } catch (error) {
        console.error('Chyba pri vytváraní kanála', error)

        const err = error as {
          response?: { data?: { message?: string } }
        }

        createChannelError.value =
          err.response?.data?.message ??
          'Nepodarilo sa vytvoriť kanál. Skús to ešte raz.'
      } finally {
        creatingChannel.value = false
      }
    }

    // DELETE CHANNEL handler
    const onDeleteCurrentChannel = async () => {
      if (!currentChannel.value || !currentUser.value) return
      if (!canDeleteCurrentChannel.value) return

      const title = currentChannel.value.title
      const id = currentChannel.value.id

      const ok = window.confirm(
        `Naozaj chceš vymazať kanál "${title}"?\nTúto akciu nie je možné vrátiť.`
      )
      if (!ok) return

      try {
        deletingChannel.value = true
        await api.delete(`/channels/${id}`)

        // odstráň z lokálneho zoznamu
        channels.value = channels.value.filter(c => c.id !== id)

        // reset aktuálneho kanála
        currentChannel.value = null
        currentChannelTitle.value = null

        // pošli event do IndexPage, aby si vyčistil správy
        window.dispatchEvent(
          new CustomEvent('channelSelected', {
            detail: {
              id: null,
              title: null
            }
          })
        )
      } catch (error) {
        console.error('Chyba pri mazaní kanála', error)
        window.alert('Kanál sa nepodarilo vymazať. Skús to znova.')
      } finally {
        deletingChannel.value = false
      }
    }

    const navigateHome = () => {
      void router.push('/app')
      // Reset current channel when navigating home
      currentChannel.value = null
      currentChannelTitle.value = null
      window.dispatchEvent(
        new CustomEvent('channelSelected', {
          detail: {
            id: null,
            title: null
          }
        })
      )
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
      currentChannel,

      showHeader,
      isSettingsPage,
      showComposer,

      handleAccept,
      handleReject,
      handleChannelClick,

      currentUser,
      currentUserName,
      currentUserAvatar,
      currentUserStatus,
      statusDotClass,

      onTextBarSend,

      createDialogOpen,
      newChannelTitle,
      newChannelAvailability,
      creatingChannel,
      createChannelError,
      openCreateChannelDialog,
      closeCreateDialog,
      onCreateChannelConfirm,

      canDeleteCurrentChannel,
      deletingChannel,
      onDeleteCurrentChannel,

      navigateHome
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
