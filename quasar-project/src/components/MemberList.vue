<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, onUnmounted } from 'vue';
import AddUserToChannel from './AddUserToChannel.vue';
import { api } from 'boot/api';

type Status = 'online' | 'offline' | 'away' | 'dnd';
type Member = { id: number; name: string; status: Status; profilePicture?: string | null };

export default defineComponent({
  name: 'MemberList',
  components: { AddUserToChannel },
  props: {
    modelValue: { type: Boolean, required: true },
    channelId: { type: Number as () => number | null, default: null },
    inviterId: { type: Number as () => number | null, default: null },
    currentUserStatus: { type: String as () => string | null, default: null },
    currentUserId: { type: Number as () => number | null, default: null },
    channelAvailability: { type: String as () => string | null, default: null },
    isChannelOwner: { type: Boolean, default: false },
  },
  emits: ['update:modelValue', 'add'],
  // ZMENA: Pridané 'expose' do parametrov setupu
  setup(props, { emit, expose }) {
    const isOpen = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val),
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
        members.value = response.data.map(
          (m: { id: number; name: string; status: string; connection?: string; profilePicture?: string | null }) => {
            let status: Status = 'offline';

            if (props.currentUserId === m.id && props.currentUserStatus) {
              // Map 'normal' to 'online' for current user
              const userStatus = props.currentUserStatus.toLowerCase();
              status = (userStatus === 'normal' ? 'online' : userStatus) as Status;
            } else {
              // Map status based on connection and status
              const memberConnection = (m.connection || 'online').toLowerCase();
              if (memberConnection === 'offline') {
                status = 'offline';
              } else {
                const memberStatus = (m.status || 'normal').toLowerCase();
                status = memberStatus === 'normal' ? 'online' : (memberStatus as Status);
              }
            }

            return {
              id: m.id,
              name: m.name,
              status,
              profilePicture: m.profilePicture || null,
            };
          },
        );
      } catch (error) {
        console.error('Error fetching members:', error);
        members.value = [];
      } finally {
        loading.value = false;
      }
    };

    watch(() => props.channelId, fetchMembers, { immediate: true });

    watch(
      () => props.modelValue,
      (isOpen) => {
        if (isOpen && props.channelId) {
          void fetchMembers();
        }
      },
    );

    watch(
      () => props.currentUserStatus,
      () => {
        if (props.currentUserId && members.value.length > 0) {
          const currentUserMember = members.value.find((m) => m.id === props.currentUserId);
          if (currentUserMember && props.currentUserStatus) {
            // Map 'normal' to 'online'
            const mappedStatus = props.currentUserStatus.toLowerCase() === 'normal' ? 'online' : props.currentUserStatus.toLowerCase();
            currentUserMember.status = mappedStatus as Status;
          }
        }
      },
    );

    // Listen for real-time status changes from WebSocket
    const handleUserStatusChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{
        userId: number;
        status: string;
        connection?: string;
        name: string;
      }>;
      const { userId, status, connection } = customEvent.detail;

      // Update member status if they're in the current channel's member list
      const member = members.value.find((m) => m.id === userId);
      if (member) {
        // Map status based on connection and status
        let mappedStatus: Status = 'offline';
        
        if (connection === 'offline') {
          mappedStatus = 'offline';
        } else {
          // If online, map status (normal -> online)
          const statusLower = status.toLowerCase();
          mappedStatus = statusLower === 'normal' ? 'online' : (statusLower as Status);
        }
        
        member.status = mappedStatus;
        console.log(
          `✅ Updated status for user ${userId} to ${mappedStatus} (connection: ${connection}, status: ${status}) in MemberList`,
        );
      }
    };

    // Listen for user nickname changes
    const handleUserNicknameChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{
        userId: number;
        nickname?: string | null;
        firstname?: string | null;
        surname?: string | null;
        email?: string | null;
        name: string;
      }>;
      const { userId, nickname, firstname, surname, email } = customEvent.detail;

      const member = members.value.find((m) => m.id === userId);
      if (member) {
        const newName =
          nickname ||
          `${firstname ?? ''} ${surname ?? ''}`.trim() ||
          email ||
          member.name;
        member.name = newName;
        console.log(`✅ Updated nickname for user ${userId} to ${newName} in MemberList`);
      }
    };

    // Listen for user avatar changes
    const handleUserAvatarChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{
        userId: number;
        profilePicture: string;
        name: string;
      }>;
      const { userId, profilePicture } = customEvent.detail;

      const member = members.value.find((m) => m.id === userId);
      if (member) {
        // Remove cache busting parameter if present
        const cleanPath = profilePicture.split('?')[0];
        member.profilePicture = cleanPath || null;
        console.log(`✅ Updated avatar for user ${userId} in MemberList`);
      }
    };

    // Listen for new member joined (when someone accepts an invite)
    const handleMemberJoined = (event: Event) => {
      const customEvent = event as CustomEvent<{
        channelId: number;
        userId: number;
        userName: string;
        status: string;
        connection?: string;
      }>;
      const { channelId, userId, userName, status, connection } = customEvent.detail;

      // Only update if this is for the current channel
      if (channelId === props.channelId) {
        // Check if member already exists (shouldn't happen, but just in case)
        const existingMember = members.value.find((m) => m.id === userId);
        if (!existingMember) {
          // Map status based on connection and status
          let mappedStatus: Status = 'offline';
          
          const memberConnection = (connection || 'online').toLowerCase();
          if (memberConnection === 'offline') {
            mappedStatus = 'offline';
          } else {
            const statusLower = (status || 'normal').toLowerCase();
            mappedStatus = statusLower === 'normal' ? 'online' : (statusLower as Status);
          }
          
          members.value.push({
            id: userId,
            name: userName,
            status: mappedStatus,
            profilePicture: null,
          });
          console.log(
            `✅ Added new member ${userName} (${userId}) to channel ${channelId} in real-time`,
          );
        } else {
          // If member already exists, just update their status
          let mappedStatus: Status = 'offline';
          
          const memberConnection = (connection || 'online').toLowerCase();
          if (memberConnection === 'offline') {
            mappedStatus = 'offline';
          } else {
            const statusLower = (status || 'normal').toLowerCase();
            mappedStatus = statusLower === 'normal' ? 'online' : (statusLower as Status);
          }
          
          existingMember.status = mappedStatus;
          console.log(
            `✅ Updated existing member ${userName} (${userId}) status in channel ${channelId}`,
          );
        }
      }
    };

    onMounted(() => {
      window.addEventListener('userStatusChanged', handleUserStatusChanged);
      window.addEventListener('memberJoined', handleMemberJoined);
      window.addEventListener('userNicknameChanged', handleUserNicknameChanged);
      window.addEventListener('userAvatarChanged', handleUserAvatarChanged);
    });

    onUnmounted(() => {
      window.removeEventListener('userStatusChanged', handleUserStatusChanged);
      window.removeEventListener('memberJoined', handleMemberJoined);
      window.removeEventListener('userNicknameChanged', handleUserNicknameChanged);
      window.removeEventListener('userAvatarChanged', handleUserAvatarChanged);
    });

    const getInitials = (fullName: string) =>
      fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('');

    const getFullAvatarUrl = (path: string | null | undefined): string | null => {
      if (!path) return null;
      if (path.startsWith('http')) return path;

      const baseUrl = (api.defaults.baseURL as string) || 'http://localhost:3333';
      const cleanBase = baseUrl.replace(/\/$/, '');
      const cleanPath = path.startsWith('/') ? path : `/${path}`;

      return `${cleanBase}${cleanPath}`;
    };

    const statusText = (s: Status) => {
      switch (s) {
        case 'online':
          return 'Online';
        case 'away':
          return 'Away';
        case 'dnd':
          return 'Do Not Disturb';
        default:
          return 'Offline';
      }
    };

    const statusColor = (s: Status) => {
      switch (s) {
        case 'online':
          return 'positive';
        case 'away':
          return 'warning';
        case 'dnd':
          return 'negative';
        default:
          return 'grey-6';
      }
    };

    const addMember = () => {
      showAddDialog.value = true;
      emit('add');
    };

    const handleInviteSent = () => {
      void fetchMembers();
    };

    const canInvite = computed(() => {
      if (props.channelAvailability === 'private') {
        return props.isChannelOwner;
      }
      return true;
    });

    // Group members by status (Discord-like)
    const membersByStatus = computed(() => {
      const grouped: Record<Status, Member[]> = {
        online: [],
        away: [],
        dnd: [],
        offline: [],
      };

      members.value.forEach((member) => {
        if (grouped[member.status]) {
          grouped[member.status].push(member);
        } else {
          grouped.offline.push(member);
        }
      });

      return grouped;
    });

    const statusOrder: Status[] = ['online', 'away', 'dnd', 'offline'];
    const statusLabels: Record<Status, string> = {
      online: 'ONLINE',
      away: 'AWAY',
      dnd: 'DO NOT DISTURB',
      offline: 'OFFLINE',
    };

    // ZMENA: Exponovanie funkcie pre rodiča
    expose({ openAddDialog: addMember });

    return {
      isOpen,
      members,
      loading,
      getInitials,
      getFullAvatarUrl,
      statusText,
      statusColor,
      addMember,
      showAddDialog,
      handleInviteSent,
      canInvite,
      membersByStatus,
      statusOrder,
      statusLabels,
    };
  },
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
    class="discord-member-list column"
  >
    <div class="discord-header row items-center justify-between q-pa-md">
      <div class="text-h6 text-grey-9">Members list</div>
      <q-btn flat round dense icon="close" color="grey-9" @click="isOpen = false" />
    </div>

    <div class="col discord-content hide-scrollbar">
      <div v-if="loading" class="flex flex-center" style="min-height: 200px">
        <q-spinner color="primary" size="3em" />
      </div>
      <div
        v-else-if="members.length === 0"
        class="flex flex-center text-grey-6 q-pa-lg"
        style="min-height: 200px"
      >
        <div class="text-center">
          <q-icon name="people" size="3em" class="q-mb-sm" />
          <div>Žiadni členovia</div>
        </div>
      </div>
      <div v-else class="discord-members">
        <template v-for="statusKey in statusOrder" :key="statusKey">
          <div v-if="membersByStatus[statusKey].length > 0" class="status-section">
            <div class="status-header">
              <span class="status-indicator" :class="statusKey"></span>
              <span class="status-title">{{ statusLabels[statusKey] }}—{{ membersByStatus[statusKey].length }}</span>
            </div>
            <div class="members-list">
              <div
                v-for="member in membersByStatus[statusKey]"
                :key="member.id"
                class="member-item"
              >
                <q-avatar size="32px" class="member-avatar">
                  <img
                    v-if="getFullAvatarUrl(member.profilePicture)"
                    :src="getFullAvatarUrl(member.profilePicture)!"
                    style="object-fit: cover; width: 100%; height: 100%"
                    :alt="member.name"
                  />
                  <div v-else class="avatar-placeholder">{{ getInitials(member.name) }}</div>
                  <span class="member-status-dot" :class="statusKey"></span>
                </q-avatar>
                <span class="member-name" :class="`text-${statusKey === 'online' ? 'green' : statusKey === 'away' ? 'yellow' : statusKey === 'dnd' ? 'red' : 'grey'}-4`">
                  {{ member.name }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="discord-footer q-pa-md">
      <q-btn
        v-if="canInvite"
        icon="person_add"
        label="PRIDAŤ ČLENA"
        unelevated
        class="full-width add-member-btn"
        @click="addMember"
      />

      <q-btn
        v-else
        icon="lock"
        label="NEMÁŠ POVOLENIE"
        unelevated
        rounded
        disable
        class="full-width no-permission-btn"
      />
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
.discord-member-list {
  background-color: #fff3e0;
}

.discord-header {
  background-color: #ffe0b2;
  border-bottom: 1px solid #ffcc80;
}

.discord-content {
  background-color: #fff3e0;
  overflow-y: auto;
  padding: 8px;
}

.discord-members {
  padding: 8px 0;
}

.status-section {
  margin-bottom: 24px;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 4px 8px;
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #8d6e63;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator.online {
  background-color: #4caf50;
}

.status-indicator.away {
  background-color: #ff9800;
}

.status-indicator.dnd {
  background-color: #f44336;
}

.status-indicator.offline {
  background-color: #9e9e9e;
}

.status-title {
  color: #8d6e63;
}

.members-list {
  padding: 4px 0;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.member-item:hover {
  background-color: #ffe0b2;
}

.member-avatar {
  position: relative;
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ff9800;
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  border-radius: 50%;
}

.member-status-dot {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff3e0;
  box-sizing: border-box;
}

.member-status-dot.online {
  background-color: #4caf50;
}

.member-status-dot.away {
  background-color: #ff9800;
}

.member-status-dot.dnd {
  background-color: #f44336;
}

.member-status-dot.offline {
  background-color: #9e9e9e;
}

.member-name {
  font-size: 15px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.discord-footer {
  background-color: #ffe0b2;
  border-top: 1px solid #ffcc80;
}

.hide-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #ffcc80 #fff3e0;
}

.hide-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.hide-scrollbar::-webkit-scrollbar-track {
  background: #fff3e0;
}

.hide-scrollbar::-webkit-scrollbar-thumb {
  background-color: #ffcc80;
  border-radius: 4px;
}

.hide-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #ffb74d;
}

.add-member-btn {
  background-color: #ff9800;
  color: #ffffff;
  border-radius: 4px;
  font-weight: 500;
  text-transform: uppercase;
}

.add-member-btn:hover {
  background-color: #f57c00;
}

.add-member-btn:active {
  transform: translateY(1px);
}

.no-permission-btn {
  background-color: #9e9e9e !important;
  color: #ffffff !important;
  font-weight: 500;
  text-transform: uppercase;
  opacity: 0.6 !important;
}
</style>
