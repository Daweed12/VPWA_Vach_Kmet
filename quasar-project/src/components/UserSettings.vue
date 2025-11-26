<template>
  <div class="settings-root">
    <div class="scroll-outer custom-scroll">
      <div class="settings-container">
        <div class="row q-col-gutter-lg items-start">
          <!-- LEFT COLUMN -->
          <div class="col-12 col-md-4">
            <div class="column q-gutter-md">
              <!-- PROFILE CARD -->
              <q-card class="round-card">
                <q-card-section class="flex column items-center q-gutter-md compact-section">
                  <q-avatar size="140px">
                    <img src="https://cdn.quasar.dev/img/avatar4.jpg" alt="avatar" />
                  </q-avatar>

                  <div class="text-h5 text-center">
                    {{ displayName }}
                  </div>

                  <q-chip
                    :color="statusChipColor"
                    text-color="white"
                    dense
                    square
                  >
                    {{ form.status.toUpperCase() }}
                  </q-chip>

                  <div class="q-mt-sm q-pa-sm self-stretch text-center bg-grey-1 rounded-borders">
                    <div class="text-caption text-grey-7">Email</div>
                    <div class="text-body2">{{ form.email || '—' }}</div>

                    <div class="q-mt-sm text-caption text-grey-7">Nickname</div>
                    <div class="text-body2">
                      {{ form.nickname ? '@' + form.nickname : '—' }}
                    </div>
                  </div>

                  <div class="q-mt-sm column q-gutter-sm self-stretch">
                    <q-btn flat icon="photo_camera" label="Change photo" color="primary" />
                  </div>
                </q-card-section>
              </q-card>

              <!-- ACCOUNT CARD -->
              <q-card class="round-card">
                <q-card-section class="flex column items-center q-gutter-md compact-section">
                  <div class="text-subtitle1 text-weight-medium">Account</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="compact-section">
                  <div class="row q-col-gutter-sm">
                    <div class="col-12 col-md-6">
                      <q-input
                        dense
                        outlined
                        label="First Name"
                        v-model.lazy()="form.firstname"
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <q-input
                        dense
                        outlined
                        label="Last Name"
                        v-model.lazy()="form.surname"
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <q-input
                        dense
                        outlined
                        label="Nickname"
                        prefix="@"
                        v-model.lazy="form.nickname"
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <q-input
                        dense
                        outlined
                        label="Gmail"
                        type="email"
                        v-model.lazy="form.email"
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <!-- zatiaľ iba read-only, heslo nemeníme v DB -->
                      <q-input
                        dense
                        outlined
                        label="Password"
                        type="password"
                        :model-value="'********'"
                        readonly
                      />
                    </div>
                  </div>

                  <div class="row justify-end q-gutter-sm q-mt-sm">
                    <q-btn
                      flat
                      label="Cancel"
                      color="grey-8"
                      @click="resetForm"
                    />
                    <q-btn
                      unelevated
                      label="Save"
                      color="primary"
                      :loading="saving"
                      @click="saveChanges"
                    />
                  </div>
                </q-card-section>
              </q-card>

              <!-- LOGOUT -->
              <q-btn
                class="q-mt-sm"
                color="negative"
                unelevated
                no-caps
                icon="meeting_room"
                label="Logout"
                @click="logout"
              />
            </div>
          </div>

          <!-- RIGHT COLUMN -->
          <div class="col-12 col-md-8">
            <div class="column q-gutter-md">
              <!-- PRESENCE & NOTIFICATIONS -->
              <q-card class="round-card">
                <q-card-section class="compact-section">
                  <div class="status-row">
                    <div class="text-subtitle1 col-title">
                      Presence &amp; Notifications
                    </div>
                    <q-select
                      dense
                      outlined
                      class="status-select"
                      label="Status"
                      v-model="statusSelect"
                      :options="statusOptions"
                    />
                  </div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-gutter-md compact-section">
                  <div class="row items-center q-gutter-md">
                    <q-toggle v-model="notifAll" label="Povoliť notifikácie" />
                    <q-toggle
                      v-model="form.notifyOnMentionOnly"
                      label="Len @mentions"
                    />
                    <q-toggle v-model="notifMuteInDnd" label="Stlmiť v DND" />
                  </div>
                </q-card-section>
              </q-card>

              <!-- MY CHANNELS – zatiaľ staticky -->
              <q-card class="round-card">
                <q-card-section class="text-subtitle1 compact-section">
                  My channels
                </q-card-section>
                <q-separator />

                <q-list v-if="myChannels.length" separator>
                  <q-item
                    v-for="ch in myChannels"
                    :key="ch.id"
                  >
                    <q-item-section>
                      <q-item-label>#{{ ch.title }}</q-item-label>
                      <q-item-label caption class="text-caption">
                        {{ availabilityLabel(ch.availability) }} • Active
                        <q-badge
                          v-if="isChannelAdmin(ch)"
                          color="purple"
                          class="q-ml-sm"
                        >
                          Admin
                        </q-badge>
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side class="row q-gutter-sm">
                      <q-btn
                        dense
                        flat
                        icon="logout"
                        label="Leave"
                        @click="onLeaveChannel(ch)"
                      />
                      <q-btn
                        v-if="isChannelAdmin(ch)"
                        dense
                        flat
                        icon="delete"
                        color="negative"
                        label="Delete channel"
                        @click="onDeleteChannel(ch)"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>

                <q-card-section
                  v-else
                  class="compact-section text-grey-7 text-caption"
                >
                  Nie si členom žiadneho kanála.
                </q-card-section>
              </q-card>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { api } from 'boot/api'

interface CurrentUser {
  id: number
  email: string
  nickname: string
  firstname: string | null
  surname: string | null
  status: string | null
}

interface UserFromApi {
  id: number
  email: string
  nickname: string
  firstname: string | null
  surname: string | null
  status: string | null
  notifyOnMentionOnly: boolean | null
}

interface ChannelFromApi {
  id: number
  title: string
  availability: 'public' | 'private'
  creatorId?: number
  createdAt?: string
  lastMessageAt?: string | null
}

const $q = useQuasar()
const router = useRouter()

const saving = ref(false)

const currentUser = ref<CurrentUser | null>(null)
const myChannels = ref<ChannelFromApi[]>([])

const form = reactive({
  firstname: '',
  surname: '',
  nickname: '',
  email: '',
  status: 'online',
  notifyOnMentionOnly: false,
})

const original = reactive({
  firstname: '',
  surname: '',
  nickname: '',
  email: '',
  status: 'online',
  notifyOnMentionOnly: false,
})

const notifAll = ref(true)
const notifMuteInDnd = ref(true)

const statusOptions = ['ONLINE', 'AWAY', 'DND', 'OFFLINE']

const displayName = computed(() => {
  const full = `${form.firstname} ${form.surname}`.trim()
  if (full) return full
  if (form.nickname) return form.nickname
  if (form.email) return form.email
  return 'Používateľ'
})

const statusChipColor = computed(() => {
  switch (form.status) {
    case 'online':
      return 'positive'
    case 'away':
      return 'warning'
    case 'dnd':
      return 'negative'
    default:
      return 'grey'
  }
})

const statusSelect = computed({
  get: () => form.status.toUpperCase(),
  set: (val: string | null) => {
    const v = (val ?? 'ONLINE').toLowerCase()
    form.status = v

    // Update status immediately (before save) if user is logged in
    if (currentUser.value) {
      const updatedCurrent: CurrentUser = {
        ...currentUser.value,
        status: v,
      }
      currentUser.value = updatedCurrent
      localStorage.setItem('currentUser', JSON.stringify(updatedCurrent))

      // Dispatch event to update MainLayout immediately
      const event = new CustomEvent<CurrentUser>('currentUserUpdated', {
        detail: updatedCurrent,
      })
      window.dispatchEvent(event)

      // Save status to backend immediately (fire and forget)
      void (async () => {
        try {
          await api.put(`/users/${currentUser.value!.id}`, {
            status: v,
          })
        } catch (error) {
          console.error('Error updating status:', error)
          // Don't show error to user, just log it
        }
      })()
    }
  },
})

function copyForm (src: typeof form, dst: typeof form) {
  dst.firstname = src.firstname
  dst.surname = src.surname
  dst.nickname = src.nickname
  dst.email = src.email
  dst.status = src.status
  dst.notifyOnMentionOnly = src.notifyOnMentionOnly
}

function resetForm () {
  copyForm(original, form)
}

async function loadChannels (userId: number) {
  try {
    const { data } = await api.get<ChannelFromApi[]>('/channels', {
      params: { userId }
    })
    myChannels.value = data
  } catch (error) {
    console.error('Nepodarilo sa načítať kanály:', error)
  }
}



async function loadUser () {
  try {
    const raw = localStorage.getItem('currentUser')
    if (!raw) return

    const basic = JSON.parse(raw) as CurrentUser
    currentUser.value = {
      id: basic.id,
      email: basic.email,
      nickname: basic.nickname,
      firstname: basic.firstname ?? null,
      surname: basic.surname ?? null,
      status: basic.status ?? null,
    }

    const { data } = await api.get<UserFromApi>(`/users/${basic.id}`)

    form.firstname = data.firstname ?? ''
    form.surname = data.surname ?? ''
    form.nickname = data.nickname
    form.email = data.email
    form.status = data.status ?? 'online'
    form.notifyOnMentionOnly = Boolean(data.notifyOnMentionOnly)

    copyForm(form, original)

    await loadChannels(basic.id)

  } catch (error: unknown) {
    let message = 'Nepodarilo sa načítať profil.'

    if (axios.isAxiosError(error)) {
      const serverData = error.response?.data
      if (serverData && typeof serverData === 'object' && 'message' in serverData) {
        message = (serverData as { message: string }).message
      }
    }

    $q.notify({
      type: 'negative',
      message,
      position: 'bottom',
      timeout: 2500,
    })
  }
}

async function saveChanges () {
  if (!currentUser.value) return

  try {
    saving.value = true

    const { data } = await api.put<UserFromApi>(`/users/${currentUser.value.id}`, {
      firstname: form.firstname,
      surname: form.surname,
      nickname: form.nickname,
      email: form.email,
      status: form.status,
      notifyOnMentionOnly: form.notifyOnMentionOnly,
    })

    form.firstname = data.firstname ?? ''
    form.surname = data.surname ?? ''
    form.nickname = data.nickname
    form.email = data.email
    form.status = data.status ?? 'online'
    form.notifyOnMentionOnly = Boolean(data.notifyOnMentionOnly)
    copyForm(form, original)

    const updatedCurrent: CurrentUser = {
      id: currentUser.value.id,
      email: data.email,
      nickname: data.nickname,
      firstname: data.firstname ?? null,
      surname: data.surname ?? null,
      status: data.status ?? null,
    }
    currentUser.value = updatedCurrent
    localStorage.setItem('currentUser', JSON.stringify(updatedCurrent))

    // pošli event, aby MainLayout vedel, že sa user zmenil
    const event = new CustomEvent<CurrentUser>('currentUserUpdated', {
      detail: updatedCurrent,
    })
    window.dispatchEvent(event)

    $q.notify({
      type: 'positive',
      message: 'Profil bol uložený.',
      position: 'bottom',
      timeout: 2000,
    })
  } catch (error: unknown) {
    let message = 'Ukladanie zlyhalo.'

    if (axios.isAxiosError(error)) {
      const serverData = error.response?.data
      if (serverData && typeof serverData === 'object' && 'message' in serverData) {
        message = (serverData as { message: string }).message
      }
    }

    $q.notify({
      type: 'negative',
      message,
      position: 'bottom',
      timeout: 2500,
    })
  } finally {
    saving.value = false
  }
}

function logout () {
  localStorage.removeItem('currentUser')
  void router.push('/auth/login')
}

const availabilityLabel = (availability: string) => {
  return availability === 'public' ? 'Public' : 'Private'
}

const isChannelAdmin = (ch: ChannelFromApi) => {
  return currentUser.value != null && ch.creatorId === currentUser.value.id
}

async function onLeaveChannel (ch: ChannelFromApi) {
  if (!currentUser.value) return

  const ok = window.confirm(`Naozaj chceš odísť z kanála #${ch.title}?`)
  if (!ok) return

  try {
    // endpoint si uprav podľa backendu
    await api.post(`/channels/${ch.id}/leave`, {
      userId: currentUser.value.id
    })
    myChannels.value = myChannels.value.filter(c => c.id !== ch.id)
  } catch (error) {
    console.error('Chyba pri odchode z kanála', error)
    $q.notify({
      type: 'negative',
      message: 'Nepodarilo sa opustiť kanál.',
      position: 'bottom'
    })
  }
}

async function onDeleteChannel (ch: ChannelFromApi) {
  if (!currentUser.value || ch.creatorId !== currentUser.value.id) return

  const ok = window.confirm(
    `Naozaj chceš vymazať kanál "#${ch.title}"?\nTúto akciu nie je možné vrátiť.`
  )
  if (!ok) return

  try {
    await api.delete(`/channels/${ch.id}`)
    myChannels.value = myChannels.value.filter(c => c.id !== ch.id)
  } catch (error) {
    console.error('Chyba pri mazaní kanála', error)
    $q.notify({
      type: 'negative',
      message: 'Kanál sa nepodarilo vymazať.',
      position: 'bottom'
    })
  }
}


onMounted(() => {
  void loadUser()
})
</script>

<style scoped>
/* In UserSettings.vue */

.round-card { border-radius: 16px; }
.compact-section { padding: 16px; }

.settings-root {
  display: flex;
  flex-direction: column;
  /* This ensures it takes the full height passed from SettingsPage */
  height: 100%;
  overflow: hidden; /* Prevent double scrollbars */
}

.scroll-outer {
  flex: 1;
  overflow-y: auto;
  padding-block: 12px;
  scroll-behavior: smooth;

  /* 1. Skrytie pre Firefox */
  scrollbar-width: none;

  /* 2. Skrytie pre IE a starý Edge */
  -ms-overflow-style: none;
}

/* 3. Skrytie pre Chrome, Safari, Brave, Edge (Webkit) */
.scroll-outer::-webkit-scrollbar {
  display: none;
}

/* Custom scrollbar styling (optional, keeps it clean) */
.custom-scroll {
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: rgba(0,0,0,0.2) transparent;
}

/* Webkit (Chrome/Edge/Brave) Scrollbar styling */
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.2);
  border-radius: 10px;
}

.settings-container {
  width: 100%;
  --page-gutter: clamp(12px, 3vw, 32px);
  padding-inline: var(--page-gutter);


  padding-top: 8px;
  padding-bottom: 65px; /* <--- Pridaj veľa miesta naspodok (napr. 100px) */
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.col-title { flex: 1 1 auto; min-width: 200px; }
.status-select { flex: 0 0 180px; }

@media (max-width: 600px) {
  .status-select { flex-basis: 100%; }
}

</style>
