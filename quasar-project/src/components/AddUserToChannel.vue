<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { api } from 'boot/api';

type User = {
  id: number;
  nickname: string;
  email: string;
  firstname: string | null;
  surname: string | null;
  name: string;
  status: string;
};

export default defineComponent({
  name: 'AddUserToChannel',
  props: {
    channelId: { type: Number as () => number | null, default: null },
    inviterId: { type: Number as () => number | null, default: null },
  },
  emits: ['close', 'invite-sent'],
  setup(props, { emit }) {
    const query = ref('');
    const searchResults = ref<User[]>([]);
    const loading = ref(false);
    const selectedUser = ref<User | null>(null);
    const sendingInvite = ref(false);
    const error = ref('');

    let searchTimeout: ReturnType<typeof setTimeout> | null = null;

    const searchUsers = async (searchTerm: string) => {
      if (!searchTerm || searchTerm.trim().length < 2) {
        searchResults.value = [];
        return;
      }

      loading.value = true;
      error.value = '';

      try {
        const response = await api.get('/users/search', {
          params: { q: searchTerm.trim() },
        });
        searchResults.value = response.data || [];
      } catch (err) {
        console.error('Error searching users:', err);
        const axiosError = err as {
          response?: {
            data?: { message?: string; error?: string };
            status?: number;
            statusText?: string;
          };
          message?: string;
        };

        if (axiosError.response?.data?.message) {
          error.value = axiosError.response.data.message;
        } else if (axiosError.response?.data?.error) {
          error.value = `Chyba: ${axiosError.response.data.error}`;
        } else {
          error.value = 'Chyba pri vyhľadávaní používateľov. Skontroluj konzolu.';
        }
        searchResults.value = [];
      } finally {
        loading.value = false;
      }
    };

    watch(query, (newQuery) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      selectedUser.value = null;
      searchResults.value = [];

      if (!newQuery || newQuery.trim().length < 2) {
        return;
      }

      searchTimeout = setTimeout(() => {
        void searchUsers(newQuery);
      }, 300);
    });

    const selectUser = (user: User) => {
      selectedUser.value = user;
      query.value = user.name;
    };

    const sendInvite = async () => {
      if (!selectedUser.value || !props.channelId || !props.inviterId) {
        error.value = 'Chýbajú potrebné údaje. Skontroluj, či je vybraný kanál a používateľ.';
        return;
      }

      console.log('Sending invite:', {
        channelId: props.channelId,
        userId: selectedUser.value.id,
        inviterId: props.inviterId,
      });

      sendingInvite.value = true;
      error.value = '';

      try {
        const response = await api.post(`/channels/${props.channelId}/invites`, {
          userId: Number(selectedUser.value.id),
          inviterId: Number(props.inviterId),
        });

        console.log('Invite sent successfully:', response.data);

        emit('invite-sent');
        close();
      } catch (err) {
        console.error('Error sending invite:', err);
        const axiosError = err as {
          response?: {
            data?: { message?: string };
            status?: number;
            statusText?: string;
          };
          message?: string;
        };

        if (axiosError.response?.data?.message) {
          error.value = axiosError.response.data.message;
        } else if (axiosError.response?.statusText) {
          error.value = `Chyba: ${axiosError.response.statusText}`;
        } else if (axiosError.message) {
          error.value = `Chyba: ${axiosError.message}`;
        } else {
          error.value = 'Chyba pri posielaní pozvánky. Skontroluj konzolu pre viac detailov.';
        }
      } finally {
        sendingInvite.value = false;
      }
    };

    const getInitials = (name: string) => {
      return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('');
    };

    const close = () => {
      query.value = '';
      searchResults.value = [];
      selectedUser.value = null;
      error.value = '';
      emit('close');
    };

    return {
      query,
      searchResults,
      loading,
      selectedUser,
      sendingInvite,
      error,
      selectUser,
      sendInvite,
      getInitials,
      close,
    };
  },
});
</script>

<template>
  <q-card style="min-width: 520px; max-width: 90vw">
    <q-card-section class="row items-center justify-between">
      <div class="text-h6">Pridať používateľa do kanálu</div>
      <q-btn flat round dense icon="close" @click="close" />
    </q-card-section>

    <q-separator />

    <q-card-section class="q-gutter-md">
      <q-input
        v-model="query"
        label="Zadaj nickname alebo e-mail"
        placeholder="Zadaj meno alebo e-mail…"
        filled
        dense
        clearable
        autofocus
        :loading="loading"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <q-banner v-if="error" class="bg-negative text-white q-mt-sm">
        <template #avatar>
          <q-icon name="error" color="white" />
        </template>
        <div>{{ error }}</div>
        <div v-if="!$props.channelId || !$props.inviterId" class="text-caption q-mt-xs opacity-80">
          Debug: channelId={{ $props.channelId }}, inviterId={{ $props.inviterId }}
        </div>
      </q-banner>

      <div v-if="loading && !selectedUser" class="flex flex-center q-pa-md">
        <q-spinner color="primary" size="2em" />
      </div>

      <div v-else-if="searchResults.length > 0 && !selectedUser" class="q-gutter-sm">
        <div
          v-for="user in searchResults"
          :key="user.id"
          class="q-pa-sm bg-grey-2 rounded-borders cursor-pointer"
          :class="{ 'bg-grey-3': false }"
          @click="selectUser(user)"
        >
          <div class="row items-center q-gutter-sm">
            <q-avatar color="primary" text-color="white" size="40px">
              {{ getInitials(user.name) }}
            </q-avatar>
            <div class="col">
              <div class="text-body1">{{ user.name }}</div>
              <div class="text-caption text-grey-7">{{ user.email }}</div>
            </div>
            <q-icon name="add_circle" color="primary" size="24px" />
          </div>
        </div>
      </div>

      <div v-else-if="selectedUser" class="q-pa-sm bg-primary text-white rounded-borders">
        <div class="row items-center q-gutter-sm">
          <q-avatar color="white" text-color="primary" size="40px">
            {{ getInitials(selectedUser.name) }}
          </q-avatar>
          <div class="col">
            <div class="text-body1 text-weight-medium">{{ selectedUser.name }}</div>
            <div class="text-caption">{{ selectedUser.email }}</div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            color="white"
            @click="
              selectedUser = null;
              query = '';
            "
          />
        </div>
      </div>

      <div
        v-else-if="query.length >= 2 && !loading && searchResults.length === 0"
        class="text-grey-6 text-center q-pa-md"
      >
        Žiadni používatelia nenájdení
      </div>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right">
      <q-btn flat label="Zrušiť" @click="close" :disable="sendingInvite" />
      <q-btn
        color="primary"
        label="Poslať pozvánku"
        :disable="!selectedUser || !$props.channelId || !$props.inviterId || sendingInvite"
        :loading="sendingInvite"
        @click="sendInvite"
      />
    </q-card-actions>
  </q-card>
</template>

<style scoped>
.rounded-borders {
  border-radius: 12px;
}
</style>
