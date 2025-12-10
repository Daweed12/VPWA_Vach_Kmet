<template>
  <div v-if="typingUsers.length > 0" class="typing-indicator-bar">
    <div
      v-for="user in typingUsers"
      :key="user.id"
      class="typing-user-bar clickable-bar"
      @click="openDraftPopup(user)"
    >
      <q-avatar size="32px" class="typing-avatar">
        <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
        <div v-else class="avatar-initials">{{ getUserInitials(user.name) }}</div>
      </q-avatar>
      <span class="typing-text">{{ user.name }} píše...</span>
    </div>

    <!-- Draft Popup -->
    <DraftPopup
      v-if="selectedUser"
      v-model="popupOpen"
      :user-name="selectedUser.name || ''"
      :user-avatar="selectedUser.avatar"
      :draft-content="selectedUser.draftContent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TypingUser } from 'src/composables/useTyping';
import DraftPopup from './DraftPopup.vue';

const props = defineProps<{
  typingUsers: TypingUser[];
}>();

const popupOpen = ref(false);
const selectedUser = ref<TypingUser | null>(null);

const getUserInitials = (name: string): string => {
  if (!name) return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0]?.[0];
    const last = parts[parts.length - 1]?.[0];
    if (first && last) {
      return (first + last).toUpperCase();
    }
  }
  return trimmed.substring(0, 2).toUpperCase();
};

const openDraftPopup = (user: TypingUser) => {
  selectedUser.value = user;
  popupOpen.value = true;
};

// Watch for realtime updates to selected user's draft content
watch(
  () => props.typingUsers,
  (users) => {
    if (selectedUser.value && popupOpen.value) {
      const updatedUser = users.find((u) => u.id === selectedUser.value?.id);
      if (updatedUser) {
        selectedUser.value = updatedUser;
      }
    }
  },
  { deep: true },
);
</script>

<style scoped>
.typing-indicator-bar {
  width: 100%;
  background-color: #424242;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.typing-user-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  cursor: pointer;
  transition: opacity 0.2s;
}

.typing-user-bar:hover {
  opacity: 0.9;
}

.typing-avatar {
  flex-shrink: 0;
}

.avatar-initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #9e9e9e;
  color: #424242;
  font-weight: 600;
  font-size: 12px;
  border-radius: 50%;
}

.typing-text {
  color: #ffffff;
  font-size: 14px;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clickable-bar {
  cursor: pointer;
}
</style>
