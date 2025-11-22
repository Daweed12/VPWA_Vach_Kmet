<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import AddUserToChannel from './AddUserToChannel.vue';
import { api } from 'boot/api';

type Status = 'online' | 'offline' | 'away' | 'dnd';
type Member = { id: number; name: string; status: Status };

export default defineComponent({
  name: 'MemberList',
  components: { AddUserToChannel },
  props: {
    modelValue: { type: Boolean, required: true },
    channelId: { type: Number as () => number | null, default: null },
    inviterId: { type: Number as () => number | null, default: null },
    currentUserStatus: { type: String as () => string | null, default: null },
    currentUserId: { type: Number as () => number | null, default: null }
  },
  emits: ['update:modelValue', 'add'],
  setup (props, { emit }) {
    const isOpen = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val)
    });

    const showAddDialog = ref(false);
    const members = ref<Member[]>([]);
    const loading = ref(false);

    const fetchMembers = async () => {
      if (!props.channelId) {
        members.value = [];
        return;
      }

      loading.value = true;
      try {
        const response = await api.get(`/channels/${props.channelId}/members`);
        members.value = response.data.map((m: { id: number; name: string; status: string }) => {
          // If this is the current user, use their status from props (synchronized with avatar)
          const status = (props.currentUserId === m.id && props.currentUserStatus)
            ? (props.currentUserStatus as Status)
            : (m.status || 'offline') as Status;
          
          return {
            id: m.id,
            name: m.name,
            status
          };
        });
      } catch (error) {
        console.error('Error fetching members:', error);
        members.value = [];
      } finally {
        loading.value = false;
      }
    };

    // Fetch members when channelId changes
    watch(() => props.channelId, fetchMembers, { immediate: true });

    // Also fetch when drawer opens (in case channelId was set before drawer opened)
    watch(() => props.modelValue, (isOpen) => {
      if (isOpen && props.channelId) {
        void fetchMembers();
      }
    });

    // Update current user's status in member list when it changes
    watch(() => props.currentUserStatus, () => {
      if (props.currentUserId && members.value.length > 0) {
        const currentUserMember = members.value.find(m => m.id === props.currentUserId);
        if (currentUserMember && props.currentUserStatus) {
          currentUserMember.status = props.currentUserStatus as Status;
        }
      }
    });

    const getInitials = (fullName: string) =>
      fullName.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');

    const statusText = (s: Status) => {
      switch (s) {
        case 'online': return 'Online';
        case 'away': return 'Away';
        case 'dnd': return 'Do Not Disturb';
        default: return 'Offline';
      }
    };

    const statusColor = (s: Status) => {
      switch (s) {
        case 'online': return 'positive';
        case 'away': return 'warning';
        case 'dnd': return 'negative';
        default: return 'grey-6';
      }
    };

    const addMember = () => {
      showAddDialog.value = true;
      emit('add');
    };

    const handleInviteSent = () => {
      // Refresh members list after invite is sent
      void fetchMembers();
    };

    return { isOpen, members, loading, getInitials, statusText, statusColor, addMember, showAddDialog, handleInviteSent };
  }
});
</script>

<template>
  <q-drawer
    v-model="isOpen"
    side="right"
    overlay
    behavior="mobile"
    :breakpoint="0"
    bordered
    :width="360"
    class="bg-orange-5 column"
  >
    <div class="row items-center justify-between q-pa-md" style="gap:8px">
      <div class="text-h6 text-grey-10">Members list</div>
      <div class="row items-center" style="gap:6px">
        <q-btn flat round dense icon="close" color="red-8" @click="isOpen = false" />
      </div>
    </div>

    <div class="col bg-orange-2 q-pa-lg hide-scrollbar" style="margin: 0 16px 8px 16px; border-radius: 16px; overflow-y: auto;">
      <div v-if="loading" class="flex flex-center" style="min-height: 200px;">
        <q-spinner color="primary" size="3em" />
      </div>
      <div v-else-if="members.length === 0" class="flex flex-center text-grey-6" style="min-height: 200px;">
        <div class="text-center">
          <q-icon name="people" size="3em" class="q-mb-sm" />
          <div>Žiadni členovia</div>
        </div>
      </div>
      <div v-else class="row q-col-gutter-md">
        <div class="col-4" v-for="m in members" :key="m.id">
          <div class="relative-position flex flex-center" style="height:96px;">
            <q-avatar
              size="70px"
              color="orange-1"
              text-color="blue-8"
              class="shadow-2"
              :title="`${m.name} - ${statusText(m.status)}`"
            >
              {{ getInitials(m.name) }}
              <span class="status-dot" :class="m.status" />
              <q-tooltip
                :delay="250"
                anchor="bottom middle"
                self="top middle"
                transition-show="jump-down"
                transition-hide="jump-up"
                class="bg-grey-10 text-white"
              >
                <div class="text-weight-medium">{{ m.name }}</div>
                <div class="row items-center q-mt-xs" style="gap:6px">
                  <q-badge rounded :color="statusColor(m.status)" style="width:10px;height:10px;padding:0" />
                  <span class="text-caption">{{ statusText(m.status) }}</span>
                </div>
              </q-tooltip>
            </q-avatar>
          </div>
        </div>
      </div>
    </div>

    <div class="q-pa-md flex flex-center bg-orange-5">
      <q-btn
        color="primary"
        icon="person_add"
        label="Pridať člena"
        push
        glossy
        class="q-mt-sm"
        @click="addMember"
      >
        <q-tooltip>Pridať nového člena</q-tooltip>
      </q-btn>
    </div>
  </q-drawer>

  <q-dialog v-model="showAddDialog" persistent transition-show="scale" transition-hide="scale">
    <AddUserToChannel
      :channel-id="channelId"
      :inviter-id="inviterId"
      @close="showAddDialog = false"
      @invite-sent="handleInviteSent"
    />
  </q-dialog>
</template>

<style scoped>
.hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }

.status-dot {
  position:absolute;
  right:-2px;
  bottom:-2px;
  width:14px; height:14px;
  border-radius:50%;
  border:2px solid #FEE7D7;
}
.status-dot.online  { background:#4CAF50; } /* zelená */
.status-dot.away    { background:#f2c037; } /* žltá */
.status-dot.dnd     { background:#F44336; } /* červená */
.status-dot.offline { background:#9E9E9E; } /* šedá */
</style>
