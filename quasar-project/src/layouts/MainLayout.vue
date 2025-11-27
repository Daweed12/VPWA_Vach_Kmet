<template>
  <q-layout view="lhh lpR lFr" class="no-page-scroll">
    <q-header v-if="showHeader" class="bg-orange-1 text-grey-9 left-top-corner">
      <div style="height: 20px;" class="bg-primary" />

      <q-toolbar>
        <q-toolbar-title>
          <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

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

        <template v-if="!isSettingsPage">
          <q-btn
            v-if="canDeleteCurrentChannel"
            dense
            flat
            round
            icon="close"
            :disable="deletingChannel"
            @click="onDeleteCurrentChannel"
          />

          <q-btn dense flat round icon="person_add" @click="onAddPersonClick">
            <q-tooltip>Pridať člena do kanála</q-tooltip>
          </q-btn>

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

    <div class="column no-wrap test">
      <q-drawer
        show-if-above
        v-model="leftDrawerOpen"
        side="left"
        class="bg-orange-5 column"
      >
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

        <div class="col q-pa-md bg-orange-2 drawer-div-wrapper column relative-position">
          <div
            v-if="!showCmd"
            class="col full-height hide-scrollbar"
          >
            <q-list>
              <div class="q-mb-sm">
                <ChannelSearchHeader
                  v-model="channelSearch"
                  @create-channel="openCreateChannelDialog"
                />
              </div>

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

              <q-item-label header class="section-label row items-center justify-between">
                <div class="row items-center">
                  Channels
                  <span v-if="filteredChannels.length" class="count-badge q-ml-sm">
                    {{ filteredChannels.length }}
                  </span>
                </div>
                <q-btn
                  round
                  unelevated
                  color="orange-7"
                  text-color="white"
                  icon="add"
                  size="sm"
                  dense
                  class="add-channel-btn"
                  @click="openAddChannelDialog"
                >
                  <q-tooltip anchor="top middle" self="bottom middle">
                    Pripojiť sa ku kanálu
                  </q-tooltip>
                </q-btn>
              </q-item-label>

              <channel
                v-for="ch in filteredChannels"
                :key="'ch-' + ch.id"
                :name="ch.title"
                :availability="ch.availability"
                :image-url="ch.logo ?? ''"
                @click="() => handleChannelClick(ch)"
              />
            </q-list>
          </div>

          <div v-else class="col full-height">
            <CommandPanel
              :history="commandHistory"
              :current-channel="currentChannel"
              :current-user="currentUser"
              @close="showCmd = false"
              @log="handleCmdLog"
              @clear="handleCmdClear"
            />
          </div>
        </div>

        <div
          class="q-pa-none bg-orange-2 drawer-div-wrapper"
          style="margin-top: 10px; padding: 2px"
        >
          <q-item>
            <q-item-section avatar>
              <q-avatar size="56px" class="avatar-with-status">
                <img
                  :src="currentUserAvatar"
                  alt="avatar"
                  style="object-fit: cover; width: 100%; height: 100%;"
                  @error="(e) => { (e.target as HTMLImageElement).src = 'https://cdn.quasar.dev/img/avatar4.jpg' }"
                />
                <div class="status-dot" :class="statusDotClass" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ currentUserName }}</q-item-label>
              <q-item-label caption>{{ currentUserStatus }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row items-center">
                <q-btn
                  flat
                  round
                  dense
                  :color="showCmd ? 'green-8' : 'black'"
                  icon="terminal"
                  size="lg"
                  class="q-mr-xs"
                  @click="showCmd = !showCmd"
                >
                  <q-tooltip>{{ showCmd ? 'Zavrieť CMD' : 'Otvor CMD' }}</q-tooltip>
                </q-btn>

                <q-btn
                  flat
                  round
                  dense
                  :color="isSettingsPage ? 'green-8' : 'black'"
                  icon="settings"
                  size="lg"
                  @click="toggleSettings"
                >
                  <q-tooltip>{{ isSettingsPage ? 'Späť na chat' : 'Otvor nastavenia účtu' }}</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
        </div>

        <div style="height: 10px;" class="bg-primary" />
      </q-drawer>

      <MemberList
        ref="memberListRef"
        v-if="!isSettingsPage"
        v-model="rightDrawerOpen"
        :channel-id="currentChannel?.id ?? null"
        :inviter-id="currentUser?.id ?? null"
        :current-user-status="currentUser?.status ?? null"
        :current-user-id="currentUser?.id ?? null"
        :channel-availability="currentChannel?.availability ?? null"
        :is-channel-owner="canDeleteCurrentChannel"
      />

      <q-page-container class="bg-orange-3">
        <router-view />
      </q-page-container>
    </div>

    <q-footer
      v-if="showComposer"
      class="bg-orange-1 footer-wrapper q-pa-sm"
    >
      <text-bar
        class="full-width full-height"
        @send="onTextBarSend"
        @typing="onTextBarTyping"
      />
    </q-footer>

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
            :rules="[(val) => (!!val && val.trim().length >= 3) || 'Min. 3 znaky']"
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
          <div v-if="createChannelError" class="text-negative text-caption">
            {{ createChannelError }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Zrušiť" color="grey" @click="closeCreateDialog" />
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

    <q-dialog v-model="addChannelDialogOpen" persistent transition-show="scale" transition-hide="scale">
      <AddChannelToUser
        :user-id="currentUser?.id ?? null"
        @close="closeAddChannelDialog"
        @channel-joined="handleChannelJoinedFromDialog"
      />
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
import CommandPanel from 'components/CommandPanel.vue'
import AddChannelToUser from 'components/AddChannelToUser.vue'
import { api } from 'boot/api'

// Interfaces
interface ChannelFromApi { id: number; title: string; availability: string; creatorId?: number; createdAt?: string; lastMessageAt?: string | null; logo?: string | null; }
interface InviteFromApi { id: number; channelId: number; title: string; availability: string; inviterId: number; createdAt: string; }
interface CurrentUser { id: number; email: string; nickname: string; firstname: string | null; surname: string | null; status: string | null; profilePicture: string | null; }
interface CmdLog { type: 'input' | 'output' | 'error'; text: string; }

interface MemberListInstance {
  openAddDialog: () => void;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

export default {
  components: {
    ChannelSearchHeader,
    textBar,
    channel: ChannelBar,
    MemberList,
    CommandPanel,
    AddChannelToUser
  },

  setup () {
    const leftDrawerOpen = ref(true)
    const rightDrawerOpen = ref(false)
    const showCmd = ref(false)

    const memberListRef = ref<MemberListInstance | null>(null)

    const route = useRoute()
    const router = useRouter()

    const invites = ref<InviteFromApi[]>([])
    const channels = ref<ChannelFromApi[]>([])
    const channelSearch = ref('')

    const currentChannelTitle = ref<string | null>(null)
    const currentChannel = ref<ChannelFromApi | null>(null)
    const currentUser = ref<CurrentUser | null>(null)

    const commandHistory = ref<CmdLog[]>([
      { type: 'output', text: 'Vitaj v inTouch CMD.' },
      { type: 'output', text: 'Napíš /help pre pomoc.' }
    ])

    const showHeader = computed(() => route.meta.showHeader !== false)
    const isSettingsPage = computed(() => route.path.startsWith('/app/settings'))
    const showComposer = computed(() => !isSettingsPage.value)

    const createDialogOpen = ref(false)
    const newChannelTitle = ref('')
    const newChannelAvailability = ref<'public' | 'private'>('public')
    const creatingChannel = ref(false)
    const createChannelError = ref('')
    const deletingChannel = ref(false)

    const addChannelDialogOpen = ref(false)

    const canDeleteCurrentChannel = computed(() => {
      if (!currentUser.value || !currentChannel.value) return false
      return currentChannel.value.creatorId === currentUser.value.id
    })

    const onAddPersonClick = () => {
      if (!currentChannel.value) {
        window.alert('Najprv musíš vybrať kanál.')
        return
      }
      if (memberListRef.value) {
        memberListRef.value.openAddDialog()
      }
    }

    // Handlery pre CMD udalosti (emitované z CommandPanel)
    const handleCmdLog = (entry: CmdLog) => {
      commandHistory.value.push(entry)
    }

    const handleCmdClear = () => {
      commandHistory.value = []
    }

    function toggleLeftDrawer () { leftDrawerOpen.value = !leftDrawerOpen.value }
    function toggleRightDrawer () { rightDrawerOpen.value = !rightDrawerOpen.value }

    const handleAccept = async (inv: InviteFromApi) => {
      await api.post(`/invites/${inv.id}/accept`)
      invites.value = invites.value.filter((i) => i.id !== inv.id)
      if (!channels.value.find((c) => c.id === inv.channelId)) {
        channels.value.unshift({ id: inv.channelId, title: inv.title, availability: inv.availability })
      }
    }
    const handleReject = async (inv: InviteFromApi) => {
      await api.post(`/invites/${inv.id}/reject`)
      invites.value = invites.value.filter((i) => i.id !== inv.id)
    }
    const handleChannelClick = (ch: ChannelFromApi) => {
      currentChannelTitle.value = ch.title
      currentChannel.value = ch
      window.dispatchEvent(new CustomEvent('channelSelected', { detail: { id: ch.id, title: ch.title } }))
    }
    const filteredChannels = computed(() => {
      const term = channelSearch.value.trim().toLowerCase()
      if (!term) return channels.value
      return channels.value.filter((c) => c.title.toLowerCase().includes(term))
    })
    const currentUserName = computed(() => {
      if (!currentUser.value) return 'User'
      if (currentUser.value.nickname && currentUser.value.nickname.trim() !== '') return currentUser.value.nickname
      const fullName = `${currentUser.value.firstname ?? ''} ${currentUser.value.surname ?? ''}`.trim()
      if (fullName) return fullName
      return currentUser.value.email
    })
    const currentUserAvatar = computed(() => {
      const pic = currentUser.value?.profilePicture
      if (!pic) return 'https://cdn.quasar.dev/img/avatar4.jpg'
      if (pic.startsWith('http')) return pic

      const baseUrl = (api.defaults.baseURL as string) || 'http://localhost:3333'
      const cleanBase = baseUrl.replace(/\/$/, '')
      const cleanPath = pic.startsWith('/') ? pic : `/${pic}`

      return `${cleanBase}${cleanPath}`
    })
    const currentUserStatus = computed(() => currentUser.value?.status ?? 'online')
    const statusDotClass = computed(() => {
      const status = (currentUser.value?.status ?? 'online').toLowerCase()
      return { 'bg-green': status === 'online', 'bg-amber': status === 'away', 'bg-red': status === 'dnd', 'bg-grey': status === 'offline' }
    })
    const toggleSettings = async () => {
      if (isSettingsPage.value) {
        await router.push('/app')
        if (currentChannel.value) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('channelSelected', { detail: { id: currentChannel.value?.id, title: currentChannel.value?.title } }))
          }, 50)
        }
      } else {
        await router.push('/app/settings')
      }
    }

    onMounted(async () => {
      const stored = localStorage.getItem('currentUser')
      if (stored) currentUser.value = JSON.parse(stored)

      if (currentUser.value?.id) {
        try {
          const userRes = await api.get(`/users/${currentUser.value.id}`)
          currentUser.value = userRes.data
          localStorage.setItem('currentUser', JSON.stringify(userRes.data))
        } catch (error) {
          console.error('Nepodarilo sa obnoviť údaje používateľa:', error)
        }
      }

      const userId = currentUser.value?.id
      if (userId) {
        const chRes = await api.get('/channels', { params: { userId } })
        channels.value = chRes.data
        const invRes = await api.get('/invites', { params: { userId } })
        invites.value = invRes.data
      }

      const handleUserUpdate = (event: Event) => {
        const customEvent = event as CustomEvent<CurrentUser>
        if (customEvent.detail) {
          currentUser.value = customEvent.detail
          localStorage.setItem('currentUser', JSON.stringify(customEvent.detail))
        }
      }
      window.addEventListener('currentUserUpdated', handleUserUpdate)

      const handleChannelDeleted = (event: Event) => {
        const customEvent = event as CustomEvent<{ channelId: number; title: string }>
        const { channelId } = customEvent.detail
        
        // Remove channel from list
        channels.value = channels.value.filter(c => c.id !== channelId)
        
        // If deleted channel is current, clear it
        if (currentChannel.value?.id === channelId) {
          currentChannel.value = null
          currentChannelTitle.value = null
          window.dispatchEvent(new CustomEvent('channelSelected', { 
            detail: { id: null, title: null } 
          }))
        }
        
        console.log(`✅ Removed channel ${channelId} from list in real-time`)
      }
      window.addEventListener('channelDeleted', handleChannelDeleted)

      const handleChannelCreated = (event: Event) => {
        const customEvent = event as CustomEvent<{ id: number; title: string; availability: string; creatorId: number; createdAt: string; userId?: number }>
        const data = customEvent.detail
        
        // Pridaj kanál LEN ak je používateľ tvorcom (userId matches currentUser.id)
        // Pre public aj private kanály - kanál sa zobrazí len tvorcovi
        // Ostatní používatelia ho uvidia až keď sa pripoja cez tlačidlo "+" alebo dostanú pozvánku
        if (!data.userId || currentUser.value?.id !== data.userId) {
          // Event nie je pre aktuálneho používateľa, ignoruj
          return
        }
        
        // Check if channel already exists in list
        if (!channels.value.find(c => c.id === data.id)) {
          channels.value.unshift({
            id: data.id,
            title: data.title,
            availability: data.availability,
            creatorId: data.creatorId,
            createdAt: data.createdAt
          })
          console.log(`✅ Added channel ${data.id} (${data.title}) to list in real-time (creator only)`)
        }
      }
      window.addEventListener('channelCreated', handleChannelCreated)

      const handleInviteCreated = (event: Event) => {
        const customEvent = event as CustomEvent<{ id: number; channelId: number; title: string; availability: string; createdAt: string; userId: number }>
        const data = customEvent.detail
        
        // Only add invite if it's for the current user
        if (currentUser.value?.id === data.userId) {
          // Check if invite already exists in list
          if (!invites.value.find(i => i.id === data.id)) {
            invites.value.unshift({
              id: data.id,
              channelId: data.channelId,
              title: data.title,
              availability: data.availability,
              inviterId: 0, // Will be loaded from server if needed
              createdAt: data.createdAt
            })
            console.log(`✅ Added invite ${data.id} for channel ${data.channelId} to list in real-time`)
          }
        }
      }
      window.addEventListener('inviteCreated', handleInviteCreated)

      const handleChannelJoined = (event: Event) => {
        const customEvent = event as CustomEvent<{ channelId: number; userId: number; channel: ChannelFromApi }>
        const data = customEvent.detail
        
        // Only add channel if it's for the current user
        if (currentUser.value?.id === data.userId) {
          // Check if channel already exists in list
          if (!channels.value.find(c => c.id === data.channelId)) {
            channels.value.unshift(data.channel)
            console.log(`✅ Added channel ${data.channelId} (${data.channel.title}) to list in real-time`)
          }
        }
      }
      window.addEventListener('channelJoined', handleChannelJoined)

      const handleOpenMemberList = () => {
        rightDrawerOpen.value = true
      }
      window.addEventListener('openMemberList', handleOpenMemberList)

      return () => { 
        window.removeEventListener('currentUserUpdated', handleUserUpdate)
        window.removeEventListener('channelDeleted', handleChannelDeleted)
        window.removeEventListener('channelCreated', handleChannelCreated)
        window.removeEventListener('inviteCreated', handleInviteCreated)
        window.removeEventListener('openMemberList', handleOpenMemberList)
        window.removeEventListener('channelJoined', handleChannelJoined)
      }
    })

    const onTextBarTyping = (isTyping: boolean, draftContent?: string) => { if (typeof window.emitTyping === 'function') window.emitTyping(isTyping, draftContent) }

    const onTextBarSend = async (text: string) => {
      const cmd = text.trim().toLowerCase()
      if (cmd === '/list') { rightDrawerOpen.value = true; return }
      if (!currentChannel.value || !currentUser.value) return
      if (text.trim().startsWith('/')) { console.log('Príkaz:', text); return }
      onTextBarTyping(false)
      const messageText = text.trim()
      if (typeof window.addMessageToChat === 'function') window.addMessageToChat(messageText)
      try {
        const response = await api.post(`/channels/${currentChannel.value.id}/messages`, { content: messageText, senderId: currentUser.value.id })
        console.log('✅ Message sent:', response.data)
      } catch (error) { console.error('❌ Chyba pri odosielaní správy:', error); window.alert('Nepodarilo sa odoslať správu.') }
    }

    function openCreateChannelDialog () {
      if (!currentUser.value) { window.alert('Najprv sa prihlás.'); return }
      createChannelError.value = ''; newChannelTitle.value = ''; newChannelAvailability.value = 'public'; createDialogOpen.value = true
    }
    function closeCreateDialog () { if (creatingChannel.value) return; createDialogOpen.value = false }

    function openAddChannelDialog () {
      if (!currentUser.value) { window.alert('Najprv sa prihlás.'); return }
      addChannelDialogOpen.value = true
    }
    function closeAddChannelDialog () { addChannelDialogOpen.value = false }
    const handleChannelJoinedFromDialog = (channel: ChannelFromApi) => {
      // Channel will be added via WebSocket event, but we can also add it here for immediate feedback
      if (!channels.value.find(c => c.id === channel.id)) {
        channels.value.unshift(channel)
      }
      closeAddChannelDialog()
    }
    const onCreateChannelConfirm = async () => {
      if (!currentUser.value) { createChannelError.value = 'Nie si prihlásený.'; return }
      const title = newChannelTitle.value.trim()
      if (title.length < 3) { createChannelError.value = 'Min. 3 znaky.'; return }
      const lower = title.toLowerCase()
      if (channels.value.some(c => c.title.trim().toLowerCase() === lower)) { createChannelError.value = 'Kanál už existuje.'; return }
      creatingChannel.value = true; createChannelError.value = ''
      try {
        const payload = { title, availability: newChannelAvailability.value, creatorId: currentUser.value.id }
        const res = await api.post('/channels', payload)
        const created = res.data as ChannelFromApi
        
        // Počkaj krátko na WebSocket event (kanál sa pridá cez handleChannelCreated)
        // Ak sa kanál nepridal cez WebSocket do 300ms, pridáme ho manuálne
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Skontroluj, či sa kanál už nepridal cez WebSocket
        if (!channels.value.find(c => c.id === created.id)) {
          channels.value.unshift(created)
          handleChannelClick(created)
        } else {
          // Kanál už existuje cez WebSocket, len ho vyber
          const existingChannel = channels.value.find(c => c.id === created.id)
          if (existingChannel) {
            handleChannelClick(existingChannel)
          }
        }
        
        createDialogOpen.value = false
        creatingChannel.value = false
      } catch (err: unknown) {
        console.error('Chyba:', err);
        const error = err as ApiError;
        createChannelError.value = error.response?.data?.message ?? 'Chyba.'
        creatingChannel.value = false
      }
    }
    const onDeleteCurrentChannel = async () => {
      if (!currentChannel.value || !currentUser.value || !canDeleteCurrentChannel.value) return
      const ok = window.confirm(`Vymazať kanál "${currentChannel.value.title}"?`)
      if (!ok) return
      try {
        deletingChannel.value = true; await api.delete(`/channels/${currentChannel.value.id}`)
        channels.value = channels.value.filter(c => c.id !== currentChannel.value!.id)
        currentChannel.value = null; currentChannelTitle.value = null
        window.dispatchEvent(new CustomEvent('channelSelected', { detail: { id: null, title: null } }))
      } catch (error) { console.error('Chyba:', error); window.alert('Chyba pri mazaní.') } finally { deletingChannel.value = false }
    }
    const navigateHome = () => { void router.push('/app'); currentChannel.value = null; currentChannelTitle.value = null; window.dispatchEvent(new CustomEvent('channelSelected', { detail: { id: null, title: null } })) }

    return {
      leftDrawerOpen, rightDrawerOpen, toggleLeftDrawer, toggleRightDrawer, showCmd,
      invites, channels, filteredChannels, channelSearch, currentChannelTitle, currentChannel,
      showHeader, isSettingsPage, showComposer,
      handleAccept, handleReject, handleChannelClick,
      currentUser, currentUserName, currentUserAvatar, currentUserStatus, statusDotClass,
      onTextBarSend, onTextBarTyping,
      createDialogOpen, newChannelTitle, newChannelAvailability, creatingChannel, createChannelError, openCreateChannelDialog, closeCreateDialog, onCreateChannelConfirm,
      addChannelDialogOpen, openAddChannelDialog, closeAddChannelDialog, handleChannelJoinedFromDialog,
      canDeleteCurrentChannel, deletingChannel, onDeleteCurrentChannel, navigateHome,
      commandHistory, toggleSettings,

      memberListRef,
      onAddPersonClick,
      handleCmdLog,
      handleCmdClear
    }
  }
}
</script>

<style>
.q-page-container, .no-page-scroll .q-page { height: 100%; overflow: hidden; }
html, body, #q-app { height: 100%; overflow: hidden !important; }
.no-page-scroll { height: 100vh !important; overflow: hidden !important; }
.q-page-container { height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
.test { flex: 1; min-height: 0; overflow: hidden; }
.footer-wrapper { border-radius: 20px; }
.full-width { width: 100%; }
.full-height { height: 100%; }
.drawer-div-wrapper { border-radius: 20px; margin: 0 10px 0 10px; }
.hide-scrollbar { overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }
.avatar-with-status { position: relative; }
.status-dot { position: absolute; bottom: 0px; right: 0px; width: 22px; height: 22px; border-radius: 50%; border: 4px solid #fef3c7; box-sizing: border-box; }
.section-label { color: #8d6e63; text-transform: uppercase; letter-spacing: 0.06em; display: flex; align-items: center; gap: 6px; }
.count-badge { font-size: 11px; line-height: 1; padding: 2px 6px; border-radius: 10px; background: #ffb74d; color: #4e342e; }
.q-drawer__content::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
.q-drawer__content { scrollbar-width: none !important; -ms-overflow-style: none !important; overflow-x: hidden !important; }
</style>
