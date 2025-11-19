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
                    <q-btn flat icon="visibility" label="Public profile" color="primary" />
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

              <!-- PRIVACY & TYPING -->
              <q-card class="round-card">
                <q-card-section class="text-subtitle1 compact-section">
                  Privacy &amp; Typing
                </q-card-section>
                <q-separator />
                <q-card-section class="q-gutter-md compact-section">
                  <q-toggle
                    v-model="typingVisible"
                    label="Zobrazovať ostatným, že píšem"
                  />
                  <q-toggle
                    v-model="typingPreview"
                    label="Zdieľať náhľad rozpísanej správy"
                  />
                </q-card-section>
              </q-card>

              <!-- MY CHANNELS – zatiaľ staticky -->
              <q-card class="round-card">
                <q-card-section class="text-subtitle1 compact-section">
                  My channels
                </q-card-section>
                <q-separator />
                <q-list separator>
                  <q-item>
                    <q-item-section>
                      <q-item-label>#general</q-item-label>
                      <q-item-label caption class="text-caption">
                        Public • Active
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side class="row q-gutter-sm">
                      <q-btn dense flat icon="logout" label="Leave" />
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label>#devs</q-item-label>
                      <q-item-label caption class="text-caption">
                        Private • Active
                        <q-badge color="purple" class="q-ml-sm">Admin</q-badge>
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side class="row q-gutter-sm">
                      <q-btn dense flat icon="logout" label="Leave" />
                      <q-btn
                        dense
                        flat
                        icon="delete"
                        color="negative"
                        label="Delete channel"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>

              <!-- COMMAND HELP -->
              <q-card class="round-card">
                <q-expansion-item
                  dense-expand
                  label="Command quick help"
                  expand-icon="expand_more"
                >
                  <q-separator />
                  <q-card-section class="q-gutter-xs compact-section text-body2">
                    <div><code>/join channelName [private]</code> – pridať sa / vytvoriť kanál</div>
                    <div><code>/invite nickName</code> – pozvať používateľa</div>
                    <div><code>/revoke nickName</code> – odobrať používateľovi prístup (private)</div>
                    <div><code>/kick nickName</code> – vyhodiť člena</div>
                    <div><code>/quit</code> – správca zruší kanál</div>
                    <div><code>/cancel</code> – opustiť kanál</div>
                    <div><code>/list</code> – zoznam členov kanála</div>
                    <div><code>/change_channel_visibility</code> – zmeň kanál z private na public a naopak</div>
                    <div><code>@nickname</code> – adresovať správu konkrétnemu používateľovi</div>
                  </q-card-section>
                </q-expansion-item>
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

const $q = useQuasar()
const router = useRouter()

const saving = ref(false)

const currentUser = ref<CurrentUser | null>(null)

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

// toggles, ktoré zatiaľ neposielame na server
const notifAll = ref(true)
const notifMuteInDnd = ref(true)
const typingVisible = ref(true)
const typingPreview = ref(true)

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

onMounted(() => {
  void loadUser()
})
</script>

<style scoped>
.round-card { border-radius: 16px; }
.compact-section { padding: 16px; }

.settings-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.scroll-outer {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-block: 12px;
}

.settings-container {
  width: 100%;
  --page-gutter: clamp(12px, 3vw, 32px);
  padding-inline: var(--page-gutter);
  padding-block: 8px;
}

.custom-scroll { scrollbar-width: none; }
.custom-scroll::-webkit-scrollbar { display: none; }

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
