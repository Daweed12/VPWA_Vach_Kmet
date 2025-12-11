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
                    <img :src="avatarSrc" alt="avatar" />
                  </q-avatar>

                  <div class="text-h5 text-center">
                    {{ displayName }}
                  </div>

                  <q-chip :color="statusChipColor" text-color="white" dense square>
                    {{ statusChipText }}
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
                    <q-btn
                      flat
                      icon="photo_camera"
                      label="Change photo"
                      color="primary"
                      @click="openPhotoDialog"
                    />
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
                      <q-input dense outlined label="First Name" v-model.lazy="form.firstname" />
                    </div>
                    <div class="col-12 col-md-6">
                      <q-input dense outlined label="Last Name" v-model.lazy="form.surname" />
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
                  </div>

                  <div class="row justify-end q-gutter-sm q-mt-sm">
                    <q-btn flat label="Cancel" color="grey-8" @click="resetForm" />
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
            </div>
          </div>

          <!-- RIGHT COLUMN -->
          <div class="col-12 col-md-8">
            <div class="column q-gutter-md">
              <!-- PRESENCE & NOTIFICATIONS -->
              <q-card class="round-card">
                <q-card-section class="compact-section">
                  <div class="status-row">
                    <div class="text-subtitle1 col-title">Presence &amp; Notifications</div>
                    <div class="row q-gutter-sm" style="flex: 0 0 auto;">
                      <q-select
                        dense
                        outlined
                        class="status-select"
                        label="Status"
                        v-model="unifiedStatusSelect"
                        :options="unifiedStatusOptions"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- MY CHANNELS -->
              <q-card class="round-card my-channels-card">
                <q-card-section class="text-subtitle1 compact-section">
                  My channels
                </q-card-section>
                <q-separator />
                <div class="my-channels-scroll">
                  <q-list v-if="myChannels.length" separator>
                    <q-item v-for="ch in myChannels" :key="ch.id">
                      <q-item-section>
                        <q-item-label>#{{ ch.title }}</q-item-label>
                        <q-item-label caption class="text-caption">
                          {{ availabilityLabel(ch.availability) }} • Active
                          <q-badge v-if="isChannelAdmin(ch)" color="purple" class="q-ml-sm">
                            Admin
                          </q-badge>
                        </q-item-label>
                      </q-item-section>

                      <q-item-section side class="row q-gutter-sm">
                        <q-btn dense flat icon="logout" label="Leave" @click="onLeaveChannel(ch)" />
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

                  <q-card-section v-else class="compact-section text-grey-7 text-caption">
                    Nie si členom žiadneho kanála.
                  </q-card-section>
                </div>
              </q-card>

              <!-- ACTION BUTTONS -->
              <div class="row q-gutter-sm channels-actions">
                <q-btn
                  class="col"
                  color="primary"
                  unelevated
                  no-caps
                  icon="lock_reset"
                  label="Reset password"
                  @click="resetDialogOpen = true"
                />

                <q-btn
                  class="col"
                  color="negative"
                  unelevated
                  no-caps
                  icon="delete_forever"
                  :loading="deletingProfile"
                  label="Delete profile"
                  @click="onDeleteProfile"
                />

                <q-btn
                  class="col"
                  color="negative"
                  unelevated
                  no-caps
                  icon="meeting_room"
                  label="Logout"
                  @click="logout"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CHANGE PHOTO DIALOG -->
    <q-dialog v-model="photoDialogOpen" persistent>
      <q-card style="min-width: 420px; max-width: 640px">
        <q-card-section>
          <div class="text-h6">Change photo</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Pretiahni sem obrázok alebo ho vyber z počítača, potom ho priblíž sliderom a ulož.
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="avatar-dropzone" @dragover.prevent @drop.prevent="onPhotoDrop">
            <div class="avatar-preview-wrapper">
              <div class="avatar-preview-circle">
                <img
                  v-if="previewImage"
                  :src="previewImage"
                  alt="preview"
                  class="avatar-preview-img"
                  :style="previewImgStyle"
                />
              </div>
            </div>

            <div class="text-caption text-grey-7 q-mt-sm">Pretiahni obrázok sem alebo</div>
            <q-btn
              class="q-mt-xs"
              flat
              color="primary"
              label="Vybrať súbor"
              size="sm"
              @click="triggerFileInput"
            />
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden-input"
              @change="onPhotoFileChange"
            />
          </div>

          <div class="q-mt-md">
            <div class="text-caption text-grey-7 q-mb-xs">Zoom</div>
            <q-slider v-model="zoom" :min="1" :max="3" :step="0.05" />
          </div>

          <div v-if="photoError" class="text-negative text-caption q-mt-sm">
            {{ photoError }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancel"
            color="grey"
            :disable="savingPhoto"
            @click="closePhotoDialog"
          />
          <q-btn
            unelevated
            label="Save photo"
            color="primary"
            :loading="savingPhoto"
            @click="savePhoto"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- RESET PASSWORD DIALOG -->
    <q-dialog v-model="resetDialogOpen" persistent>
      <q-card style="min-width: 360px">
        <q-card-section>
          <div class="text-h6">Reset password</div>
          <div class="text-caption text-grey-7 q-mt-xs">Zmeň svoje heslo k účtu.</div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-md">
          <q-input
            v-model="resetPasswordForm.currentPassword"
            label="Current password"
            type="password"
            dense
            outlined
            autofocus
          />

          <q-input
            v-model="resetPasswordForm.newPassword"
            label="New password"
            type="password"
            dense
            outlined
          />

          <q-input
            v-model="resetPasswordForm.confirmPassword"
            label="Confirm new password"
            type="password"
            dense
            outlined
          />

          <div v-if="resetError" class="text-negative text-caption q-mt-xs">
            {{ resetError }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancel"
            color="grey"
            :disable="resetLoading"
            @click="closeResetDialog"
          />
          <q-btn
            unelevated
            label="Change password"
            color="primary"
            :loading="resetLoading"
            @click="submitResetPassword"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { api } from 'boot/api';

interface CurrentUser {
  id: number;
  email: string;
  nickname: string;
  firstname: string | null;
  surname: string | null;
  status: string | null;
  connection?: string | null;
  profilePicture: string | null;
}

interface UserFromApi {
  id: number;
  email: string;
  nickname: string;
  firstname: string | null;
  surname: string | null;
  status: string | null;
  connection?: string | null;
  notifyOnMentionOnly: boolean | null;
  profilePicture: string | null;
}

interface ChannelFromApi {
  id: number;
  title: string;
  availability: 'public' | 'private';
  creatorId?: number;
  createdAt?: string;
  lastMessageAt?: string | null;
}

const $q = useQuasar();
const router = useRouter();

const saving = ref(false);
const deletingProfile = ref(false);

const currentUser = ref<CurrentUser | null>(null);
const myChannels = ref<ChannelFromApi[]>([]);

const form = reactive({
  firstname: '',
  surname: '',
  nickname: '',
  email: '',
  status: 'normal',
  connection: 'online',
  notifyOnMentionOnly: false,
});

const original = reactive({
  firstname: '',
  surname: '',
  nickname: '',
  email: '',
  status: 'normal',
  connection: 'online',
  notifyOnMentionOnly: false,
});

const unifiedStatusOptions = ['ONLINE', 'AWAY', 'DND', 'OFFLINE'];

// RESET PASSWORD STATE
const resetDialogOpen = ref(false);
const resetLoading = ref(false);
const resetError = ref('');

const resetPasswordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// CHANGE PHOTO STATE
const photoDialogOpen = ref(false);
const savingPhoto = ref(false);
const photoError = ref('');
const rawPhotoData = ref<string | null>(null);
const zoom = ref(1.2);
const fileInputRef = ref<HTMLInputElement | null>(null);

// default avatar
const defaultAvatarUrl = 'https://cdn.quasar.dev/img/avatar4.jpg';

const avatarSrc = computed(() => {
  const pic = currentUser.value?.profilePicture;
  if (!pic) return defaultAvatarUrl;

  // ak je v DB už plná URL (napr. https://...)
  if (pic.startsWith('http://') || pic.startsWith('https://')) {
    return pic;
  }

  // inak je to relatívna cesta z backendu (napr. /uploads/avatars/xyz.png)
  const base = api.defaults.baseURL || '';
  const needsSlash = pic.startsWith('/') ? '' : '/';
  return `${base}${needsSlash}${pic}`;
});

const previewImage = computed(() => rawPhotoData.value || avatarSrc.value);

const previewImgStyle = computed(() => ({
  transform: `scale(${zoom.value})`,
}));

const displayName = computed(() => {
  const full = `${form.firstname} ${form.surname}`.trim();
  if (full) return full;
  if (form.nickname) return form.nickname;
  if (form.email) return form.email;
  return 'Používateľ';
});

const statusChipColor = computed(() => {
  if (form.connection === 'offline') {
    return 'grey';
  }
  switch (form.status) {
    case 'normal':
      return 'positive';
    case 'away':
      return 'warning';
    case 'dnd':
      return 'negative';
    default:
      return 'grey';
  }
});

const statusChipText = computed(() => {
  if (form.connection === 'offline') {
    return 'OFFLINE';
  }
  return form.status.toUpperCase();
});

// Unified status select - combines connection and status
const unifiedStatusSelect = computed({
  get: () => {
    // If offline, always show OFFLINE
    if (form.connection === 'offline') {
      return 'OFFLINE';
    }
    // If online, show status (normal -> ONLINE, away -> AWAY, dnd -> DND)
    if (form.status === 'normal') return 'ONLINE';
    return form.status?.toUpperCase() ?? 'ONLINE';
  },
  set: (val: string | null) => {
    const selectedStatus = (val ?? 'ONLINE').toUpperCase();
    
    let newConnection: string;
    let newStatus: string;

    if (selectedStatus === 'OFFLINE') {
      // Offline: connection = 'offline', status zostáva
      newConnection = 'offline';
      newStatus = form.status; // Keep current status
    } else {
      // Online, Away, DND: connection = 'online', status = selected
      newConnection = 'online';
      if (selectedStatus === 'ONLINE') {
        newStatus = 'normal';
      } else {
        newStatus = selectedStatus.toLowerCase();
      }
    }

    form.connection = newConnection;
    form.status = newStatus;

    if (currentUser.value) {
      const updatedCurrent: CurrentUser = {
        ...currentUser.value,
        connection: newConnection,
        status: newStatus,
      };
      currentUser.value = updatedCurrent;
      localStorage.setItem('currentUser', JSON.stringify(updatedCurrent));

      const event = new CustomEvent<CurrentUser>('currentUserUpdated', {
        detail: updatedCurrent,
      });
      window.dispatchEvent(event);

      void (async () => {
        try {
          await api.put(`/users/${currentUser.value!.id}`, {
            connection: newConnection,
            status: newStatus,
          });
        } catch (error) {
          console.error('Error updating status/connection:', error);
        }
      })();
    }
  },
});

function copyForm(src: typeof form, dst: typeof form) {
  dst.firstname = src.firstname;
  dst.surname = src.surname;
  dst.nickname = src.nickname;
  dst.email = src.email;
  dst.status = src.status;
  dst.connection = src.connection;
  dst.notifyOnMentionOnly = src.notifyOnMentionOnly;
}

function resetForm() {
  copyForm(original, form);
}

/* ==== CHANGE PHOTO – logika ==== */
function openPhotoDialog() {
  photoDialogOpen.value = true;
  photoError.value = '';
  rawPhotoData.value = null;
  zoom.value = 1.2;
  if (fileInputRef.value) fileInputRef.value.value = '';
}

function closePhotoDialog() {
  if (savingPhoto.value) return;
  photoDialogOpen.value = false;
  photoError.value = '';
  rawPhotoData.value = null;
  zoom.value = 1.2;
  if (fileInputRef.value) fileInputRef.value.value = '';
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

function loadImageFile(file: File) {
  photoError.value = '';

  if (!file.type.startsWith('image/')) {
    photoError.value = 'Prosím vyber obrázok.';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    rawPhotoData.value = reader.result as string;
    zoom.value = 1.2;
  };
  reader.onerror = () => {
    photoError.value = 'Nepodarilo sa načítať obrázok.';
  };
  reader.readAsDataURL(file);
}

function onPhotoFileChange(evt: Event) {
  const input = evt.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  loadImageFile(file);
}

function onPhotoDrop(evt: DragEvent) {
  const file = evt.dataTransfer?.files?.[0];
  if (!file) return;
  loadImageFile(file);
}

function generateCroppedImage(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!rawPhotoData.value) {
      reject(new Error('Žiadny obrázok'));
      return;
    }

    // If GIF, skip canvas to preserve animation – upload original data URL
    if (rawPhotoData.value.startsWith('data:image/gif')) {
      resolve(rawPhotoData.value);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const size = 400;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context chýba'));
        return;
      }

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const zoomFactor = zoom.value || 1;
      const minDim = Math.min(img.width, img.height);
      const baseSize = minDim / zoomFactor;

      const sx = (img.width - baseSize) / 2;
      const sy = (img.height - baseSize) / 2;

      ctx.drawImage(img, sx, sy, baseSize, baseSize, 0, 0, size, size);
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error('Nepodarilo sa načítať obrázok'));
    img.src = rawPhotoData.value;
  });
}

async function savePhoto() {
  if (!currentUser.value) {
    photoError.value = 'Nie si prihlásený.';
    return;
  }

  if (!rawPhotoData.value) {
    photoError.value = 'Najprv vyber obrázok.';
    return;
  }

  try {
    savingPhoto.value = true;
    photoError.value = '';

    const cropped = await generateCroppedImage();

    const { data } = await api.put<{ profilePicture: string }>(
      `/users/${currentUser.value.id}/photo`,
      { image: cropped },
    );

    const updatedCurrent: CurrentUser = {
      ...currentUser.value,
      profilePicture: data.profilePicture,
    };
    currentUser.value = updatedCurrent;
    localStorage.setItem('currentUser', JSON.stringify(updatedCurrent));

    // Aktualizuj avatary v správach - pridaj timestamp pre cache busting
    const timestamp = Date.now();
    const profilePictureWithCache = `${data.profilePicture}?t=${timestamp}`;

    // Dispatch window event pre aktualizáciu currentUser
    const event = new CustomEvent<CurrentUser>('currentUserUpdated', {
      detail: updatedCurrent,
    });
    window.dispatchEvent(event);

    // Dispatch aj userAvatarChanged event pre aktualizáciu avatárov v správach
    window.dispatchEvent(
      new CustomEvent('userAvatarChanged', {
        detail: {
          userId: currentUser.value.id,
          profilePicture: profilePictureWithCache,
          name:
            currentUser.value.nickname ||
            `${currentUser.value.firstname ?? ''} ${currentUser.value.surname ?? ''}`.trim() ||
            currentUser.value.email,
        },
      }),
    );

    $q.notify({
      type: 'positive',
      message: 'Fotka bola uložená.',
      position: 'bottom',
      timeout: 2000,
    });

    closePhotoDialog();
  } catch (error: unknown) {
    console.error('Chyba pri ukladaní fotky:', error);

    let message = 'Nepodarilo sa uložiť fotku.';
    if (axios.isAxiosError(error)) {
      const serverData = error.response?.data;
      if (serverData && typeof serverData === 'object' && 'message' in serverData) {
        message = (serverData as { message: string }).message;
      }
    }

    photoError.value = message;

    $q.notify({
      type: 'negative',
      message,
      position: 'bottom',
      timeout: 2500,
    });
  } finally {
    savingPhoto.value = false;
  }
}

/* RESET PASSWORD LOGIC */
function closeResetDialog() {
  if (resetLoading.value) return;
  resetDialogOpen.value = false;
  resetError.value = '';
  resetPasswordForm.currentPassword = '';
  resetPasswordForm.newPassword = '';
  resetPasswordForm.confirmPassword = '';
}

async function submitResetPassword() {
  resetError.value = '';

  if (!currentUser.value) {
    resetError.value = 'Nie si prihlásený.';
    return;
  }

  if (!resetPasswordForm.currentPassword || !resetPasswordForm.newPassword) {
    resetError.value = 'Vyplň všetky polia.';
    return;
  }

  if (resetPasswordForm.newPassword.length < 6) {
    resetError.value = 'Nové heslo musí mať aspoň 6 znakov.';
    return;
  }

  if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
    resetError.value = 'Nové heslá sa nezhodujú.';
    return;
  }

  try {
    resetLoading.value = true;

    await api.post('/auth/change-password', {
      userId: currentUser.value.id,
      currentPassword: resetPasswordForm.currentPassword,
      newPassword: resetPasswordForm.newPassword,
    });

    $q.notify({
      type: 'positive',
      message: 'Heslo bolo zmenené.',
      position: 'bottom',
      timeout: 2000,
    });

    closeResetDialog();
  } catch (error: unknown) {
    console.error('Chyba pri zmene hesla:', error);

    let message = 'Nepodarilo sa zmeniť heslo.';
    if (axios.isAxiosError(error)) {
      const serverData = error.response?.data;
      if (serverData && typeof serverData === 'object' && 'message' in serverData) {
        message = (serverData as { message: string }).message;
      }
    }

    resetError.value = message;

    $q.notify({
      type: 'negative',
      message,
      position: 'bottom',
      timeout: 2500,
    });
  } finally {
    resetLoading.value = false;
  }
}

/* LOAD USER + CHANNELS */
async function loadChannels(userId: number) {
  try {
    const { data } = await api.get<ChannelFromApi[]>('/channels', {
      params: { userId },
    });
    myChannels.value = data;
  } catch (error) {
    console.error('Nepodarilo sa načítať kanály:', error);
  }
}

async function loadUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return;

    const basic = JSON.parse(raw) as Partial<CurrentUser>;

    const { data } = await api.get<UserFromApi>(`/users/${basic.id}`);

    form.firstname = data.firstname ?? '';
    form.surname = data.surname ?? '';
    form.nickname = data.nickname;
    form.email = data.email;
    form.status = data.status ?? 'normal';
    form.connection = data.connection ?? 'online';
    form.notifyOnMentionOnly = Boolean(data.notifyOnMentionOnly);

    copyForm(form, original);

    const updatedCurrent: CurrentUser = {
      id: data.id,
      email: data.email,
      nickname: data.nickname,
      firstname: data.firstname ?? null,
      surname: data.surname ?? null,
      status: data.status ?? null,
      connection: data.connection ?? 'online',
      profilePicture: data.profilePicture ?? null,
    };
    currentUser.value = updatedCurrent;
    localStorage.setItem('currentUser', JSON.stringify(updatedCurrent));

    await loadChannels(data.id);
  } catch (error: unknown) {
    let message = 'Nepodarilo sa načítať profil.';

    if (axios.isAxiosError(error)) {
      const serverData = error.response?.data;
      if (serverData && typeof serverData === 'object' && 'message' in serverData) {
        message = (serverData as { message: string }).message;
      }
    }

    $q.notify({
      type: 'negative',
      message,
      position: 'bottom',
      timeout: 2500,
    });
  }
}

async function saveChanges() {
  if (!currentUser.value) return;

  try {
    saving.value = true;

    const { data } = await api.put<UserFromApi>(`/users/${currentUser.value.id}`, {
      firstname: form.firstname,
      surname: form.surname,
      nickname: form.nickname,
      email: form.email,
      status: form.status,
      connection: form.connection,
      notifyOnMentionOnly: form.notifyOnMentionOnly,
    });

    form.firstname = data.firstname ?? '';
    form.surname = data.surname ?? '';
    form.nickname = data.nickname;
    form.email = data.email;
    form.status = data.status ?? 'normal';
    form.connection = data.connection ?? 'online';
    form.notifyOnMentionOnly = Boolean(data.notifyOnMentionOnly);
    copyForm(form, original);

    const updatedCurrent: CurrentUser = {
      id: currentUser.value.id,
      email: data.email,
      nickname: data.nickname,
      firstname: data.firstname ?? null,
      surname: data.surname ?? null,
      status: data.status ?? null,
      connection: data.connection ?? 'online',
      profilePicture: data.profilePicture ?? currentUser.value.profilePicture,
    };
    currentUser.value = updatedCurrent;
    localStorage.setItem('currentUser', JSON.stringify(updatedCurrent));

    const event = new CustomEvent<CurrentUser>('currentUserUpdated', {
      detail: updatedCurrent,
    });
    window.dispatchEvent(event);

    $q.notify({
      type: 'positive',
      message: 'Profil bol uložený.',
      position: 'bottom',
      timeout: 2000,
    });
  } catch (error: unknown) {
    let message = 'Ukladanie zlyhalo.';

    if (axios.isAxiosError(error)) {
      const serverData = error.response?.data;
      if (serverData && typeof serverData === 'object' && 'message' in serverData) {
        message = (serverData as { message: string }).message;
      }
    }

    $q.notify({
      type: 'negative',
      message,
      position: 'bottom',
      timeout: 2500,
    });
  } finally {
    saving.value = false;
  }
}

function logout() {
  localStorage.removeItem('currentUser');
  void router.push('/auth/login');
}

/* MY CHANNELS HELPERS */
const availabilityLabel = (availability: string) => {
  return availability === 'public' ? 'Public' : 'Private';
};

const isChannelAdmin = (ch: ChannelFromApi) => {
  return currentUser.value != null && ch.creatorId === currentUser.value.id;
};

async function onLeaveChannel(ch: ChannelFromApi) {
  if (!currentUser.value) return;

  const ok = window.confirm(`Naozaj chceš odísť z kanála #${ch.title}?`);
  if (!ok) return;

  try {
    await api.post(`/channels/${ch.id}/leave`, {
      userId: currentUser.value.id,
    });
    myChannels.value = myChannels.value.filter((c) => c.id !== ch.id);
  } catch (error) {
    console.error('Chyba pri odchode z kanála', error);
    $q.notify({
      type: 'negative',
      message: 'Nepodarilo sa opustiť kanál.',
      position: 'bottom',
    });
  }
}

async function onDeleteChannel(ch: ChannelFromApi) {
  if (!currentUser.value || ch.creatorId !== currentUser.value.id) return;

  const ok = window.confirm(
    `Naozaj chceš vymazať kanál "#${ch.title}"?\nTúto akciu nie je možné vrátiť.`,
  );
  if (!ok) return;

  try {
    await api.delete(`/channels/${ch.id}`);
    myChannels.value = myChannels.value.filter((c) => c.id !== ch.id);
  } catch (error) {
    console.error('Chyba pri mazaní kanála', error);
    $q.notify({
      type: 'negative',
      message: 'Kanál sa nepodarilo vymazať.',
      position: 'bottom',
    });
  }
}

/* DELETE PROFILE */
async function onDeleteProfile() {
  if (!currentUser.value) return;

  const ok = window.confirm(
    'Naozaj chceš natrvalo vymazať svoj profil?\nTúto akciu nie je možné vrátiť.',
  );
  if (!ok) return;

  try {
    deletingProfile.value = true;

    await api.delete(`/users/${currentUser.value.id}`);

    $q.notify({
      type: 'positive',
      message: 'Profil bol vymazaný.',
      position: 'bottom',
      timeout: 2000,
    });

    localStorage.removeItem('currentUser');
    currentUser.value = null;
    void router.push('/auth/login');
  } catch (error) {
    console.error('Chyba pri mazaní profilu:', error);

    let message = 'Profil sa nepodarilo vymazať.';
    if (axios.isAxiosError(error)) {
      const serverData = error.response?.data;
      if (serverData && typeof serverData === 'object' && 'message' in serverData) {
        message = (serverData as { message: string }).message;
      }
    }

    $q.notify({
      type: 'negative',
      message,
      position: 'bottom',
      timeout: 2500,
    });
  } finally {
    deletingProfile.value = false;
  }
}

// Listen for channel deletion events
const handleChannelDeleted = (event: Event) => {
  const customEvent = event as CustomEvent<{ channelId: number; title: string }>;
  const { channelId } = customEvent.detail;

  // Remove channel from myChannels list
  myChannels.value = myChannels.value.filter((c) => c.id !== channelId);

  console.log(`✅ Removed channel ${channelId} from myChannels in real-time`);
};

onMounted(() => {
  void loadUser();
  window.addEventListener('channelDeleted', handleChannelDeleted);
});

onUnmounted(() => {
  window.removeEventListener('channelDeleted', handleChannelDeleted);
});
</script>

<style scoped>
.round-card {
  border-radius: 16px;
}
.compact-section {
  padding: 16px;
}

.channels-actions {
  margin-top: 8px;
}

/* tlačidlám dáme rovnakú šírku v rade */
.channels-actions .q-btn {
  flex: 1 1 0;
}

/* na mobiloch nech idú pod seba */
@media (max-width: 700px) {
  .channels-actions {
    flex-wrap: wrap;
  }
  .channels-actions .q-btn {
    flex: 1 1 100%;
  }
}

/* ===== Change photo dialog ===== */
.avatar-dropzone {
  border: 1px dashed #e0e0e0;
  border-radius: 16px;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  text-align: center;
}

.avatar-preview-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.avatar-preview-circle {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  overflow: hidden;
  background: #eeeeee;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.15s ease;
}

.hidden-input {
  display: none;
}

.settings-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.scroll-outer {
  flex: 1;
  overflow-y: auto;
  padding-block: 12px;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scroll-outer::-webkit-scrollbar {
  display: none;
}

.custom-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

.settings-container {
  width: 100%;
  --page-gutter: clamp(12px, 3vw, 32px);
  padding-inline: var(--page-gutter);
  padding-top: 8px;
  padding-bottom: 65px;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.col-title {
  flex: 1 1 auto;
  min-width: 200px;
}
.status-select {
  flex: 0 0 180px;
}

@media (max-width: 600px) {
  .status-select {
    flex-basis: 100%;
  }
}

.my-channels-card {
  max-height: 420px;
  display: flex;
  flex-direction: column;
}

.my-channels-scroll {
  flex: 1;
  overflow-y: auto;
}

.my-channels-scroll::-webkit-scrollbar {
  width: 6px;
}
.my-channels-scroll::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background-color: rgba(0, 0, 0, 0.2);
}
</style>
