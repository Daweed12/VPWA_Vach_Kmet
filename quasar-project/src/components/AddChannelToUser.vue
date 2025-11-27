<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { api } from 'boot/api';

type Channel = {
  id: number;
  title: string;
  availability: string;
  creatorId: number;
  createdAt: string;
};

export default defineComponent({
  name: 'AddChannelToUser',
  props: {
    userId: { type: Number as () => number | null, default: null }
  },
  emits: ['close', 'channel-joined'],
  setup(props, { emit }) {
    const query = ref('');
    const searchResults = ref<Channel[]>([]);
    const loading = ref(false);
    const selectedChannel = ref<Channel | null>(null);
    const joiningChannel = ref(false);
    const error = ref('');

    let searchTimeout: ReturnType<typeof setTimeout> | null = null;

    const searchChannels = async (searchTerm: string) => {
      if (!searchTerm || searchTerm.trim().length < 1) {
        searchResults.value = [];
        return;
      }

      if (!props.userId) {
        error.value = 'Nie si prihlásený.';
        return;
      }

      loading.value = true;
      error.value = '';

      try {
        const response = await api.get('/channels/search', {
          params: { 
            q: searchTerm.trim(),
            userId: props.userId
          }
        });
        searchResults.value = response.data || [];
      } catch (err) {
        console.error('Error searching channels:', err);
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
          error.value = 'Chyba pri vyhľadávaní kanálov. Skontroluj konzolu.';
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

      selectedChannel.value = null;
      searchResults.value = [];

      if (!newQuery || newQuery.trim().length < 1) {
        return;
      }

      searchTimeout = setTimeout(() => {
        void searchChannels(newQuery);
      }, 300);
    });

    const selectChannel = (channel: Channel) => {
      selectedChannel.value = channel;
      query.value = channel.title;
    };

    const joinChannel = async () => {
      if (!selectedChannel.value || !props.userId) {
        error.value = 'Chýbajú potrebné údaje. Skontroluj, či si prihlásený.';
        return;
      }

      // Skontroluj, či userId je platné číslo
      const userId = Number(props.userId)
      if (Number.isNaN(userId) || userId <= 0) {
        error.value = 'Neplatné ID používateľa. Skús sa znova prihlásiť.';
        return;
      }

      joiningChannel.value = true;
      error.value = '';

      try {
        const response = await api.post(`/channels/${selectedChannel.value.id}/join`, {
          userId: userId
        });

        console.log('Joined channel successfully:', response.data);

        emit('channel-joined', response.data.channel);
        close();
      } catch (err) {
        console.error('Error joining channel:', err);
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
          error.value = 'Chyba pri pripájaní sa ku kanálu. Skontroluj konzolu pre viac detailov.';
        }
      } finally {
        joiningChannel.value = false;
      }
    };

    const close = () => {
      query.value = '';
      searchResults.value = [];
      selectedChannel.value = null;
      error.value = '';
      emit('close');
    };

    return {
      query,
      searchResults,
      loading,
      selectedChannel,
      joiningChannel,
      error,
      selectChannel,
      joinChannel,
      close
    };
  }
});
</script>

<template>
  <q-card style="min-width: 520px; max-width: 90vw;">
    <q-card-section class="row items-center justify-between">
      <div class="text-h6">Pripojiť sa ku kanálu</div>
      <q-btn flat round dense icon="close" @click="close" />
    </q-card-section>

    <q-separator />

    <q-card-section class="q-gutter-md">
      <q-input
        v-model="query"
        label="Zadaj názov kanála"
        placeholder="Zadaj názov kanála…"
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
      </q-banner>

      <div v-if="loading && !selectedChannel" class="flex flex-center q-pa-md">
        <q-spinner color="primary" size="2em" />
      </div>

      <div v-else-if="searchResults.length > 0 && !selectedChannel" class="q-gutter-sm">
        <div
          v-for="channel in searchResults"
          :key="channel.id"
          class="q-pa-sm bg-grey-2 rounded-borders cursor-pointer"
          @click="selectChannel(channel)"
        >
          <div class="row items-center q-gutter-sm">
            <q-icon name="tag" color="primary" size="24px" />
            <div class="col">
              <div class="text-body1">#{{ channel.title }}</div>
              <div class="text-caption text-grey-7">Public kanál</div>
            </div>
            <q-icon name="add_circle" color="primary" size="24px" />
          </div>
        </div>
      </div>

      <div v-else-if="selectedChannel" class="q-pa-sm bg-primary text-white rounded-borders">
        <div class="row items-center q-gutter-sm">
          <q-icon name="tag" color="white" size="24px" />
          <div class="col">
            <div class="text-body1 text-weight-medium">#{{ selectedChannel.title }}</div>
            <div class="text-caption">Public kanál</div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            color="white"
            @click="selectedChannel = null; query = ''"
          />
        </div>
      </div>

      <div v-else-if="query.length >= 1 && !loading && searchResults.length === 0" class="text-grey-6 text-center q-pa-md">
        Žiadne kanály nenájdené
      </div>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right">
      <q-btn flat label="Zrušiť" @click="close" :disable="joiningChannel" />
      <q-btn
        color="primary"
        label="Pripojiť sa"
        :disable="!selectedChannel || !$props.userId || joiningChannel"
        :loading="joiningChannel"
        @click="joinChannel"
      />
    </q-card-actions>
  </q-card>
</template>

<style scoped>
.rounded-borders { border-radius: 12px; }
</style>


