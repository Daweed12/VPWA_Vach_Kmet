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
            # {{ currentChannelTitle }}
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

          <div v-else class="col full-height">
            <CommandPanel
              :history="commandHistory"
              @execute="handleCommand"
              @close="showCmd = false"
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
                <img :src="currentUserAvatar" alt="avatar" />
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
import { api } from 'boot/api'

// Interfaces
interface ChannelFromApi { id: number; title: string; availability: string; creatorId?: number; createdAt?: string; lastMessageAt?: string | null; }
interface InviteFromApi { id: number; channelId: number; title: string; availability: string; inviterId: number; createdAt: string; }
interface CurrentUser { id: number; email: string; nickname: string; firstname: string | null; surname: string | null; status: string | null; profilePicture: string | null; }
interface CmdLog { type: 'input' | 'output' | 'error'; text: string; }

// Nové interface pre opravu chýb
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
    CommandPanel
  },

  setup () {
    const leftDrawerOpen = ref(true)
    const rightDrawerOpen = ref(false)
    const showCmd = ref(false)

    // OPRAVA: Typovanie refu, aby sme nemuseli pouzivat 'any'
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
      { type: 'output', text: 'Vitaj v Intouch CMD.' },
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

    const canDeleteCurrentChannel = computed(() => {
      if (!currentUser.value || !currentChannel.value) return false
      return currentChannel.value.creatorId === currentUser.value.id
    })

    // Handler pre klik na ikonu pridania usera
    const onAddPersonClick = () => {
      if (!currentChannel.value) {
        window.alert('Najprv musíš vybrať kanál.')
        return
      }
      // OPRAVA: Teraz TypeScript vie, že openAddDialog existuje
      if (memberListRef.value) {
        memberListRef.value.openAddDialog()
      }
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

      // Default
      if (!pic) return 'https://cdn.quasar.dev/img/avatar4.jpg'

      // Externý link
      if (pic.startsWith('http')) return pic

      // Lokálny backend (pridáme localhost:3333)
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
    const logToCmd = (text: string, type: 'output' | 'error' = 'output') => { commandHistory.value.push({ type, text }) }

    const handleCommand = async (rawCmd: string) => {
      commandHistory.value.push({ type: 'input', text: rawCmd })
      const parts = rawCmd.trim().split(/\s+/)
      const command = (parts[0] || '').toLowerCase()
      const args = parts.slice(1)

      switch (command) {
        case '/help':
          logToCmd('Dostupné príkazy:')
          logToCmd('/list - otvorí zoznam členov')
          logToCmd('/join [nazov] [private] - pripojí sa alebo vytvorí kanál')
          logToCmd('/invite [nick] - pozve používateľa (len mock)')
          logToCmd('/quit - zmaže aktuálny kanál (ak si vlastník)')
          logToCmd('/clear - vymaže históriu')
          logToCmd('/exit - zatvorí CMD')
          break
        case '/clear': commandHistory.value = []; break
        case '/exit': showCmd.value = false; break
        case '/list':
          if (!currentChannel.value) { logToCmd('Nie si v žiadnom kanáli.', 'error'); return }
          rightDrawerOpen.value = true; logToCmd('Otváram zoznam členov...'); break
        case '/join': {
          const channelName = args[0]; const mode = args[1]?.toLowerCase()
          if (!channelName) { logToCmd('Použitie: /join <názov_kanála> [private]', 'error'); return }
          const existing = channels.value.find(c => c.title.toLowerCase() === channelName.toLowerCase())
          if (existing) { handleChannelClick(existing); logToCmd(`Prepínam na kanál #${existing.title}`) }
          else {
            if (!currentUser.value) { logToCmd('Musíš byť prihlásený na vytváranie kanálov.', 'error'); return }
            logToCmd(`Vytváram kanál #${channelName}...`)
            try {
              const payload = { title: channelName, availability: mode === 'private' ? 'private' : 'public', creatorId: currentUser.value.id }
              const res = await api.post('/channels', payload)
              const newChannel = res.data as ChannelFromApi
              channels.value.unshift(newChannel); handleChannelClick(newChannel)
              logToCmd(`Kanál #${newChannel.title} bol vytvorený a vybraný.`)
            } catch (err: unknown) {
              // OPRAVA: Typovanie chyby
              const error = err as ApiError;
              logToCmd('Chyba pri vytváraní kanála: ' + (error.response?.data?.message || error.message), 'error')
            }
          }
          break
        }
        case '/invite': {
          if (!currentChannel.value) { logToCmd('Chyba: Nie si v žiadnom kanáli.', 'error'); return }
          const nickToInvite = args[0]
          if (!nickToInvite) { logToCmd('Použitie: /invite <nickName>', 'error'); return }
          logToCmd(`Používateľ ${nickToInvite} bol pridaný do kanála #${currentChannel.value.title}. (Simulácia)`); break
        }
        case '/quit': {
          if (!currentChannel.value) { logToCmd('Chyba: Nie je vybraný žiadny kanál.', 'error'); return }
          if (!canDeleteCurrentChannel.value) { logToCmd('Chyba: Nemáš oprávnenie.', 'error'); return }
          logToCmd(`Ruším kanál #${currentChannel.value.title}...`)
          try {
            await api.delete(`/channels/${currentChannel.value.id}`)
            channels.value = channels.value.filter(c => c.id !== currentChannel.value!.id)
            currentChannel.value = null; currentChannelTitle.value = null
            window.dispatchEvent(new CustomEvent('channelSelected', { detail: { id: null, title: null } }))
            logToCmd('Kanál bol úspešne zmazaný.')
          } catch (error) { console.error('Failed to delete channel:', error); logToCmd('Nepodarilo sa zmazať kanál.', 'error') }
          break
        }
        default: logToCmd(`Neznámy príkaz: ${command}. Skús /help`, 'error')
      }
    }

    onMounted(async () => {
      // 1. Najprv načítame z LocalStorage, aby tam niečo bolo hneď
      const stored = localStorage.getItem('currentUser')
      if (stored) currentUser.value = JSON.parse(stored)

      // 2. Ak máme ID, stiahneme ČERSTVÉ dáta zo servera
      if (currentUser.value?.id) {
        try {
          const userRes = await api.get(`/users/${currentUser.value.id}`)
          // Aktualizujeme premennú aj LocalStorage
          currentUser.value = userRes.data
          localStorage.setItem('currentUser', JSON.stringify(userRes.data))
        } catch (error) {
          console.error('Nepodarilo sa obnoviť údaje používateľa:', error)
        }
      }

      // 3. Načítanie kanálov a pozvánok (pôvodný kód)
      const userId = currentUser.value?.id
      if (userId) {
        const chRes = await api.get('/channels', { params: { userId } })
        channels.value = chRes.data
        const invRes = await api.get('/invites', { params: { userId } })
        invites.value = invRes.data
      }

      // Event listener (pôvodný kód)
      const handleUserUpdate = (event: Event) => {
        const customEvent = event as CustomEvent<CurrentUser>
        if (customEvent.detail) {
          currentUser.value = customEvent.detail
          localStorage.setItem('currentUser', JSON.stringify(customEvent.detail))
        }
      }
      window.addEventListener('currentUserUpdated', handleUserUpdate)
      return () => { window.removeEventListener('currentUserUpdated', handleUserUpdate) }
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
        channels.value.unshift(created); handleChannelClick(created); createDialogOpen.value = false
      } catch (error) { console.error('Chyba:', error); const err = error as { response?: { data?: { message?: string } } }; createChannelError.value = err.response?.data?.message ?? 'Chyba.' } finally { creatingChannel.value = false }
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
      canDeleteCurrentChannel, deletingChannel, onDeleteCurrentChannel, navigateHome,
      commandHistory, handleCommand, toggleSettings,

      memberListRef,
      onAddPersonClick
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
