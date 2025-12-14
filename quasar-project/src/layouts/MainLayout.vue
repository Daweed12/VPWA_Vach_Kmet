<template>
  <q-layout view="lhh lpR lFr" class="no-page-scroll">
    <q-header v-if="showHeader" class="bg-orange-1 text-grey-9 left-top-corner">
      <div style="height: 20px" class="bg-primary" />

      <q-toolbar>
        <q-toolbar-title>
          <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

          <span v-if="isSettingsPage"> Nastavenia používateľského účtu </span>
          <span v-else-if="currentChannelTitle">
            {{ currentChannelTitle }}
          </span>
          <span v-else> Vyber KANALOS </span>
        </q-toolbar-title>

        <!-- Typing Indicator in Header -->
        <div v-if="!isSettingsPage && headerTypingUsers.length > 0" class="header-typing-indicator">
          <q-chip
            v-for="user in headerTypingUsers"
            :key="user.id"
            size="sm"
            color="orange-3"
            text-color="grey-9"
            class="q-mr-xs clickable-chip"
            @click="openDraftPopupFromHeader(user)"
          >
            <q-icon name="edit" size="12px" class="q-mr-xs" />
            <span class="text-weight-medium">{{ user.name }}</span>
            <span class="q-ml-xs text-caption">píše...</span>
          </q-chip>
        </div>

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

          <q-btn dense flat round icon="group" @click="toggleRightDrawer" />
        </template>
      </q-toolbar>
    </q-header>

    <div class="column no-wrap test">
      <q-drawer show-if-above v-model="leftDrawerOpen" side="left" class="bg-orange-5 column">
        <div style="margin: 10px 15px 10px 15px; cursor: pointer" @click="navigateHome">
          <img
            src="../assets/intouch-logo-name.svg"
            alt="logo"
            style="width: 100%; height: auto; margin-top: 10px"
          />
        </div>

        <div class="col q-pa-md bg-orange-2 drawer-div-wrapper column relative-position">
          <div v-if="!showCmd" class="col full-height hide-scrollbar">
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
                <ChannelBar
                  v-for="inv in invites"
                  :key="'invite-' + inv.id"
                  :name="inv.title"
                  :availability="inv.availability"
                  :is-invite="true"
                  @accept="() => handleAccept(inv)"
                  @reject="() => handleReject(inv)"
                />
              </div>
              <div v-else class="text-grey-6 text-caption q-ml-sm q-mb-md">Žiadne pozvánky</div>

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

              <div v-if="filteredChannels.length">
                <ChannelBar
                  v-for="ch in filteredChannels"
                  :key="'ch-' + ch.id"
                  :name="ch.title"
                  :availability="ch.availability"
                  :image-url="ch.logo ?? ''"
                  :channel-id="ch.id"
                  :is-owner="ch.creatorId === currentUser?.id"
                  @click="() => handleChannelClickWithNavigation(ch)"
                  @leave="() => handleLeaveChannel(ch)"
                  @delete="() => handleDeleteChannel(ch)"
                />
              </div>
              <div v-else class="text-grey-6 text-caption q-ml-sm q-mb-md">
                Žiadne kanály
              </div>
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
          <q-item style="min-height: 72px; height: 72px;">
            <q-item-section avatar>
              <q-avatar size="56px" class="avatar-with-status">
                <img
                  :src="currentUserAvatar"
                  alt="avatar"
                  style="object-fit: cover; width: 100%; height: 100%"
                  @error="
                    (e) => {
                      (e.target as HTMLImageElement).src = 'https://cdn.quasar.dev/img/avatar4.jpg';
                    }
                  "
                />
                <div class="status-dot" :class="statusDotClass" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ currentUserName }}</q-item-label>
              <q-item-label caption>{{ displayStatusText }}</q-item-label>
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
                  <q-tooltip>{{
                    isSettingsPage ? 'Späť na chat' : 'Otvor nastavenia účtu'
                  }}</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
        </div>

        <div style="height: 10px" class="bg-primary" />
      </q-drawer>

      <MemberList
        ref="memberListRef"
        v-if="!isSettingsPage"
        v-model="rightDrawerOpen"
        :channel-id="currentChannel?.id ?? null"
        :inviter-id="currentUser?.id ?? null"
        :current-user-status="computedUserStatus"
        :current-user-id="currentUser?.id ?? null"
        :channel-availability="currentChannel?.availability ?? null"
        :is-channel-owner="canDeleteCurrentChannel"
      />

      <q-page-container class="bg-orange-3">
        <router-view />
      </q-page-container>
    </div>

    <q-footer v-if="showComposer" class="bg-orange-1 footer-wrapper">
      <!-- Typing Indicator above TextBar -->
      <TypingIndicator v-if="headerTypingUsers.length > 0" :typing-users="headerTypingUsers" />
      <div class="textbar-container">
        <text-bar
          class="textbar-content"
          :channel-id="currentChannel?.id ?? null"
          @send="onTextBarSend"
          @typing="onTextBarTyping"
        />
      </div>
    </q-footer>

    <!-- Draft Popup for Header -->
    <DraftPopup
      v-if="selectedHeaderUser"
      v-model="headerPopupOpen"
      :user-name="selectedHeaderUser.name || ''"
      :user-avatar="selectedHeaderUser.avatar"
      :draft-content="selectedHeaderUser.draftContent"
    />

    <q-dialog v-model="createDialogOpen" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Vytvoriť nový kanál</div>
          <div class="text-caption text-grey-7 q-mt-xs">Budeš nastavený ako vlastník kanála.</div>
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
              { label: 'Súkromný (private)', value: 'private' },
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

    <q-dialog
      v-model="addChannelDialogOpen"
      persistent
      transition-show="scale"
      transition-hide="scale"
    >
      <AddChannelToUser
        :user-id="currentUser?.id ?? null"
        @close="closeAddChannelDialog"
        @channel-joined="handleChannelJoinedFromDialog"
      />
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import textBar from 'src/components/TextBar.vue';
import ChannelBar from 'components/ChannelBar.vue';
import ChannelSearchHeader from 'components/ChannelSearchHeader.vue';
import MemberList from 'components/MemberList.vue';
import CommandPanel from 'components/CommandPanel.vue';
import AddChannelToUser from 'components/AddChannelToUser.vue';
import DraftPopup from 'components/DraftPopup.vue';
import TypingIndicator from 'components/TypingIndicator.vue';
import { api } from 'boot/api';
import { useChannels, type ChannelFromApi } from 'src/composables/useChannels';
import { useInvites, type InviteFromApi } from 'src/composables/useInvites';
import { useUser, type CurrentUser } from 'src/composables/useUser';
import type { TypingUser } from 'src/composables/useTyping';

interface MemberListInstance {
  openAddDialog: () => void;
}

interface CmdLog {
  type: 'input' | 'output' | 'error';
  text: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

const leftDrawerOpen = ref(true);
const rightDrawerOpen = ref(false);
const showCmd = ref(false);
const memberListRef = ref<MemberListInstance | null>(null);

const route = useRoute();
const router = useRouter();

/* ===== Composables ===== */
const {
  currentUser,
  currentUserName,
  currentUserAvatar,
  currentUserStatus,
  statusDotClass,
  loadUser,
} = useUser();
const {
  channels,
  channelSearch,
  currentChannel,
  currentChannelTitle,
  filteredChannels,
  canDeleteCurrentChannel,
  loadChannels,
  handleChannelClick,
} = useChannels(currentUser);
const {
  invites,
  loadInvites,
  handleAccept: acceptInvite,
  handleReject: rejectInvite,
} = useInvites(currentUser);

/* ===== Computed ===== */
const showHeader = computed(() => route.meta.showHeader !== false);
const isSettingsPage = computed(() => route.path.startsWith('/app/settings'));
const showComposer = computed(() => !isSettingsPage.value);
const isOffline = computed(() => currentUser.value?.connection === 'offline');

// Compute user status for MemberList (considering connection)
const computedUserStatus = computed(() => {
  if (!currentUser.value) return null;

  // If offline, return 'offline'
  if (currentUser.value.connection === 'offline') {
    return 'offline';
  }

  // If online, return status (normal -> online)
  const status = currentUser.value.status?.toLowerCase() ?? 'normal';
  return status === 'normal' ? 'online' : status;
});

// Display status text for UI
const displayStatusText = computed(() => {
  const status = currentUserStatus.value;
  if (!status) return 'Online';

  switch (status.toLowerCase()) {
    case 'online':
      return 'Online';
    case 'away':
      return 'Away';
    case 'dnd':
      return 'Do Not Disturb';
    case 'offline':
      return 'Offline';
    default:
      return 'Online';
  }
});

/* ===== Channel Management ===== */
const createDialogOpen = ref(false);
const newChannelTitle = ref('');
const newChannelAvailability = ref<'public' | 'private'>('public');
const creatingChannel = ref(false);
const createChannelError = ref('');
const deletingChannel = ref(false);
const addChannelDialogOpen = ref(false);

/* ===== Typing Indicator in Header ===== */
const headerTypingUsers = ref<TypingUser[]>([]);
const headerPopupOpen = ref(false);
const selectedHeaderUser = ref<TypingUser | null>(null);

const openDraftPopupFromHeader = (user: TypingUser) => {
  selectedHeaderUser.value = user;
  headerPopupOpen.value = true;
};

// Listen for typing updates via window events
const handleTypingUsersUpdate = (event: Event) => {
  const customEvent = event as CustomEvent<{ typingUsers: TypingUser[] }>;
  headerTypingUsers.value = customEvent.detail.typingUsers || [];
};

// Watch for realtime updates to selected user's draft content
watch(
  headerTypingUsers,
  (users) => {
    // Update selected user if popup is open
    if (selectedHeaderUser.value && headerPopupOpen.value) {
      const updatedUser = users.find((u) => u.id === selectedHeaderUser.value?.id);
      if (updatedUser) {
        selectedHeaderUser.value = updatedUser;
      } else {
        // User stopped typing, close popup
        headerPopupOpen.value = false;
        selectedHeaderUser.value = null;
      }
    }
  },
  { deep: true },
);

const commandHistory = ref<CmdLog[]>([
  { type: 'output', text: 'Vitaj v inTouch CMD.' },
  { type: 'output', text: 'Napíš /help pre pomoc.' },
]);

/* ===== Functions ===== */
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value;
}

const handleAccept = async (inv: InviteFromApi) => {
  const success = await acceptInvite(inv);
  if (success && !channels.value.find((c) => c.id === inv.channelId)) {
    channels.value.unshift({ id: inv.channelId, title: inv.title, availability: inv.availability });
  }
};

const handleReject = async (inv: InviteFromApi) => {
  await rejectInvite(inv);
};

const onAddPersonClick = () => {
  if (!currentChannel.value) {
    window.alert('Najprv musíš vybrať kanál.');
    return;
  }
  if (memberListRef.value) {
    memberListRef.value.openAddDialog();
  }
};

const handleCmdLog = (entry: CmdLog) => {
  commandHistory.value.push(entry);
};

const handleCmdClear = () => {
  commandHistory.value = [];
};

const toggleSettings = async () => {
  if (isSettingsPage.value) {
    await router.push('/app');
    if (currentChannel.value) {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('channelSelected', {
            detail: { id: currentChannel.value?.id, title: currentChannel.value?.title },
          }),
        );
      }, 50);
    }
  } else {
    await router.push('/app/settings');
  }
};

const handleChannelClickWithNavigation = async (ch: ChannelFromApi) => {
  // If on settings page, navigate to /app first
  if (isSettingsPage.value) {
    await router.push('/app');
    // Wait a bit for navigation to complete, then select channel
    setTimeout(() => {
      handleChannelClick(ch);
    }, 50);
  } else {
    // Normal channel click
    handleChannelClick(ch);
  }
};

function openCreateChannelDialog() {
  if (!currentUser.value) {
    window.alert('Najprv sa prihlás.');
    return;
  }
  createChannelError.value = '';
  newChannelTitle.value = '';
  newChannelAvailability.value = 'public';
  createDialogOpen.value = true;
}

function closeCreateDialog() {
  if (creatingChannel.value) return;
  createDialogOpen.value = false;
}

function openAddChannelDialog() {
  if (!currentUser.value) {
    window.alert('Najprv sa prihlás.');
    return;
  }
  addChannelDialogOpen.value = true;
}

function closeAddChannelDialog() {
  addChannelDialogOpen.value = false;
}

const handleChannelJoinedFromDialog = (channel: ChannelFromApi) => {
  if (!channels.value.find((c) => c.id === channel.id)) {
    channels.value.unshift(channel);
  }
  closeAddChannelDialog();
};

const onCreateChannelConfirm = async () => {
  if (!currentUser.value) {
    createChannelError.value = 'Nie si prihlásený.';
    return;
  }
  const title = newChannelTitle.value.trim();
  if (title.length < 3) {
    createChannelError.value = 'Min. 3 znaky.';
    return;
  }
  const lower = title.toLowerCase();
  if (channels.value.some((c) => c.title.trim().toLowerCase() === lower)) {
    createChannelError.value = 'Kanál už existuje.';
    return;
  }
  creatingChannel.value = true;
  createChannelError.value = '';
  try {
    const payload = {
      title,
      availability: newChannelAvailability.value,
      creatorId: currentUser.value.id,
    };
    const res = await api.post('/channels', payload);
    const created = res.data as ChannelFromApi;

    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!channels.value.find((c) => c.id === created.id)) {
      channels.value.unshift(created);
      handleChannelClick(created);
    } else {
      const existingChannel = channels.value.find((c) => c.id === created.id);
      if (existingChannel) {
        handleChannelClick(existingChannel);
      }
    }

    createDialogOpen.value = false;
    creatingChannel.value = false;
  } catch (err: unknown) {
    console.error('Chyba:', err);
    const error = err as ApiError;
    createChannelError.value = error.response?.data?.message ?? 'Chyba.';
    creatingChannel.value = false;
  }
};

const onDeleteCurrentChannel = async () => {
  if (!currentChannel.value || !currentUser.value || !canDeleteCurrentChannel.value) return;
  const ok = window.confirm(`Vymazať kanál "${currentChannel.value.title}"?`);
  if (!ok) return;
  try {
    deletingChannel.value = true;
    await api.delete(`/channels/${currentChannel.value.id}`);
    channels.value = channels.value.filter((c) => c.id !== currentChannel.value!.id);
    currentChannel.value = null;
    currentChannelTitle.value = null;
    window.dispatchEvent(new CustomEvent('channelSelected', { detail: { id: null, title: null } }));
  } catch (error) {
    console.error('Chyba:', error);
  } finally {
    deletingChannel.value = false;
  }
};

const handleLeaveChannel = async (channel: ChannelFromApi) => {
  if (!currentUser.value) {
    window.alert('Najprv sa prihlás.');
    return;
  }
  const ok = window.confirm(`Naozaj chceš opustiť kanál "${channel.title}"?`);
  if (!ok) return;

  try {
    await api.post(`/channels/${channel.id}/leave`, { userId: currentUser.value.id });
    // Odstrániť len tento konkrétny kanál zo zoznamu
    const channelIndex = channels.value.findIndex((c) => c.id === channel.id);
    if (channelIndex !== -1) {
      channels.value.splice(channelIndex, 1);
    }
    if (currentChannel.value?.id === channel.id) {
      currentChannel.value = null;
      currentChannelTitle.value = null;
      window.dispatchEvent(
        new CustomEvent('channelSelected', { detail: { id: null, title: null } }),
      );
    }
  } catch (error) {
    console.error('Chyba pri opustení kanála:', error);
    const apiError = error as ApiError;
    window.alert(apiError.response?.data?.message || 'Chyba pri opustení kanála.');
  }
};

const handleDeleteChannel = async (channel: ChannelFromApi) => {
  if (!currentUser.value || channel.creatorId !== currentUser.value.id) {
    return;
  }
  const ok = window.confirm(`Naozaj chceš zrušiť kanál "${channel.title}"?`);
  if (!ok) return;

  try {
    deletingChannel.value = true;
    await api.delete(`/channels/${channel.id}`);
    channels.value = channels.value.filter((c) => c.id !== channel.id);
    if (currentChannel.value?.id === channel.id) {
      currentChannel.value = null;
      currentChannelTitle.value = null;
      window.dispatchEvent(
        new CustomEvent('channelSelected', { detail: { id: null, title: null } }),
      );
    }
  } catch (error) {
    console.error('Chyba pri mazaní kanála:', error);
  } finally {
    deletingChannel.value = false;
  }
};

const navigateHome = () => {
  void router.push('/app');
  currentChannel.value = null;
  currentChannelTitle.value = null;
  window.dispatchEvent(new CustomEvent('channelSelected', { detail: { id: null, title: null } }));
};

const onTextBarTyping = (isTyping: boolean, draftContent?: string) => {
  // Do not emit typing events when offline
  if (isOffline.value) return;
  if (typeof window.emitTyping === 'function') window.emitTyping(isTyping, draftContent);
};

const onTextBarSend = async (text: string) => {
  // Block sending while offline
  if (isOffline.value) {
    window.alert('Si offline. Správy sa odošlú až po pripojení.');
    return;
  }

  const cmd = text.trim().toLowerCase();
  if (cmd === '/list') {
    rightDrawerOpen.value = true;
    return;
  }
  if (!currentChannel.value || !currentUser.value) return;
  if (text.trim().startsWith('/')) {
    console.log('Príkaz:', text);
    return;
  }
  onTextBarTyping(false);
  const messageText = text.trim();
  if (typeof window.addMessageToChat === 'function') window.addMessageToChat(messageText);
  try {
    const response = await api.post(`/channels/${currentChannel.value.id}/messages`, {
      content: messageText,
      senderId: currentUser.value.id,
    });
    console.log('Message sent:', response.data);
  } catch (error) {
    console.error('Chyba pri odosielaní správy:', error);
    window.alert('Nepodarilo sa odoslať správu.');
  }
};

/* ===== Event Handlers ===== */
const setupEventListeners = () => {
  const handleUserUpdate = (event: Event) => {
    const customEvent = event as CustomEvent<CurrentUser>;
    if (customEvent.detail) {
      currentUser.value = customEvent.detail;
      localStorage.setItem('currentUser', JSON.stringify(customEvent.detail));
    }
  };
  window.addEventListener('currentUserUpdated', handleUserUpdate);

  const handleUserAvatarChanged = (event: Event) => {
    const customEvent = event as CustomEvent<{
      userId: number;
      profilePicture: string;
      name: string;
    }>;
    const { userId, profilePicture } = customEvent.detail;

    if (currentUser.value && currentUser.value.id === userId) {
      currentUser.value.profilePicture = profilePicture;
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value));
    }
  };
  window.addEventListener('userAvatarChanged', handleUserAvatarChanged);

  const handleChannelDeleted = (event: Event) => {
    const customEvent = event as CustomEvent<{ channelId: number; title: string }>;
    const { channelId } = customEvent.detail;

    channels.value = channels.value.filter((c) => c.id !== channelId);
    if (currentChannel.value?.id === channelId) {
      currentChannel.value = null;
      currentChannelTitle.value = null;
      window.dispatchEvent(
        new CustomEvent('channelSelected', { detail: { id: null, title: null } }),
      );
    }
  };
  window.addEventListener('channelDeleted', handleChannelDeleted);

  const handleChannelLeft = (event: Event) => {
    const customEvent = event as CustomEvent<{ channelId: number; title: string }>;
    const { channelId } = customEvent.detail;

    // DÔLEŽITÉ: Odstrániť LEN tento konkrétny kanál (nie všetky kanály!)
    console.log(`Removing channel ${channelId} from list (not all channels)`);
    channels.value = channels.value.filter((c) => c.id !== channelId);

    if (currentChannel.value?.id === channelId) {
      currentChannel.value = null;
      currentChannelTitle.value = null;
      window.dispatchEvent(
        new CustomEvent('channelSelected', { detail: { id: null, title: null } }),
      );
    }
  };
  window.addEventListener('channelLeft', handleChannelLeft);

  const handleChannelCreated = (event: Event) => {
    const customEvent = event as CustomEvent<{
      id: number;
      title: string;
      availability: string;
      creatorId: number;
      createdAt: string;
      userId?: number;
    }>;
    const data = customEvent.detail;

    if (!data.userId || currentUser.value?.id !== data.userId) {
      return;
    }

    if (!channels.value.find((c) => c.id === data.id)) {
      channels.value.unshift({
        id: data.id,
        title: data.title,
        availability: data.availability,
        creatorId: data.creatorId,
        createdAt: data.createdAt,
      });
      console.log(
        `Added channel ${data.id} (${data.title}) to list in real-time (creator only)`,
      );
    }
  };
  window.addEventListener('channelCreated', handleChannelCreated);

  const handleInviteCreated = (event: Event) => {
    const customEvent = event as CustomEvent<{
      id: number;
      channelId: number;
      title: string;
      availability: string;
      createdAt: string;
      userId: number;
    }>;
    const data = customEvent.detail;

    if (currentUser.value?.id === data.userId) {
      if (!invites.value.find((i) => i.id === data.id)) {
        invites.value.unshift({
          id: data.id,
          channelId: data.channelId,
          title: data.title,
          availability: data.availability,
          inviterId: 0,
          createdAt: data.createdAt,
        });
        console.log(
          `Added invite ${data.id} for channel ${data.channelId} to list in real-time`,
        );
      }
    }
  };
  window.addEventListener('inviteCreated', handleInviteCreated);

  const handleChannelJoined = (event: Event) => {
    const customEvent = event as CustomEvent<{
      channelId: number;
      userId: number;
      channel: ChannelFromApi;
    }>;
    const data = customEvent.detail;

    if (currentUser.value?.id === data.userId) {
      if (!channels.value.find((c) => c.id === data.channelId)) {
        channels.value.unshift(data.channel);
        console.log(
          `Added channel ${data.channelId} (${data.channel.title}) to list in real-time`,
        );
      }
    }
  };
  window.addEventListener('channelJoined', handleChannelJoined);

  const handleOpenMemberList = () => {
    rightDrawerOpen.value = true;
  };
  window.addEventListener('openMemberList', handleOpenMemberList);

  // Listen for typing users updates
  window.addEventListener('typingUsersUpdated', handleTypingUsersUpdate);

  return () => {
    window.removeEventListener('currentUserUpdated', handleUserUpdate);
    window.removeEventListener('userAvatarChanged', handleUserAvatarChanged);
    window.removeEventListener('channelDeleted', handleChannelDeleted);
    window.removeEventListener('channelLeft', handleChannelLeft);
    window.removeEventListener('channelCreated', handleChannelCreated);
    window.removeEventListener('inviteCreated', handleInviteCreated);
    window.removeEventListener('openMemberList', handleOpenMemberList);
    window.removeEventListener('channelJoined', handleChannelJoined);
    window.removeEventListener('typingUsersUpdated', handleTypingUsersUpdate);
  };
};

/* ===== Watch currentUser for loading channels ===== */
watch(
  () => currentUser.value?.id,
  async (userId) => {
    if (userId) {
      await loadChannels();
      await loadInvites();
    }
  },
  { immediate: false },
);

/* ===== Lifecycle ===== */
onMounted(async () => {
  await loadUser();

  // Počkaj, kým sa načíta currentUser pred načítaním kanálov
  if (currentUser.value?.id) {
    await loadChannels();
    await loadInvites();
  } else {
    // Ak sa currentUser nenačítal z localStorage, skús ešte raz po chvíli
    setTimeout(() => {
      void (async () => {
        if (currentUser.value?.id) {
          await loadChannels();
          await loadInvites();
        }
      })();
    }, 500);
  }

  const cleanup = setupEventListeners();

  // Cleanup on unmount
  onUnmounted(() => {
    if (cleanup) cleanup();
  });
});
</script>

<style>
.q-page-container,
.no-page-scroll .q-page {
  height: 100%;
  overflow: hidden;
}
html,
body,
#q-app {
  height: 100%;
  overflow: hidden !important;
}
.no-page-scroll {
  height: 100vh !important;
  overflow: hidden !important;
}
.q-page-container {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.test {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.footer-wrapper {
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  padding: 0 !important;
}
.textbar-container {
  margin: 10px;
  display: flex;
  align-items: center;
}
.textbar-content {
  width: 100%;
  min-height: 72px; /* Match q-item min-height with 56px avatar */
  height: 72px;
  background-color: #fff3e0; /* bg-orange-2 to match user bubble */
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-sizing: border-box;
}
.drawer-div-wrapper .q-item {
  min-height: 72px !important;
  height: 72px !important;
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
.header-typing-indicator {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-right: 8px;
}
.clickable-chip {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.clickable-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
.q-drawer__content::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}
.q-drawer__content {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
  overflow-x: hidden !important;
}
</style>
