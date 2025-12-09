<template>
  <div v-if="typingUsers.length > 0" class="typing-indicator-fixed">
    <q-card class="typing-card">
      <q-card-section class="q-pa-sm">
        <div v-for="user in typingUsers" :key="user.id" class="typing-user-item">
          <div class="row items-center q-mb-xs">
            <q-icon name="edit" size="14px" class="q-mr-xs text-grey-7" />
            <span class="text-caption text-weight-medium text-grey-8">
              {{ user.name }}
            </span>
          </div>
          <div v-if="user.draftContent" class="draft-content text-body2 text-grey-7 q-pl-md">
            "{{ user.draftContent }}"
          </div>
          <div v-else class="typing-dots q-pl-md"><span>.</span><span>.</span><span>.</span></div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import type { TypingUser } from 'src/composables/useTyping';

defineProps<{
  typingUsers: TypingUser[];
}>();
</script>

<style scoped>
.typing-indicator-fixed {
  position: fixed;
  bottom: 80px;
  left: 20px;
  z-index: 2000;
  max-width: 300px;
  min-width: 200px;
}

.typing-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(8px);
}

.typing-user-item {
  margin-bottom: 8px;
}

.typing-user-item:last-child {
  margin-bottom: 0;
}

.draft-content {
  font-style: italic;
  word-break: break-word;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  color: #666;
}

.typing-dots {
  display: inline-flex;
  margin-left: 0;
}

.typing-dots span {
  animation: typing-dot 1.4s infinite;
  margin: 0 2px;
  font-size: 20px;
  line-height: 1;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-dot {
  0%,
  60%,
  100% {
    opacity: 0.3;
  }
  30% {
    opacity: 1;
  }
}
</style>
