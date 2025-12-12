<template>
  <div class="q-pt-sm q-pb-lg">
    <q-infinite-scroll
      :key="infiniteKey"
      reverse
      :offset="10"
      :debounce="120"
      @load="onLoad"
      scroll-target="#chat-scroll"
    >
      <div v-for="msg in visibleMessages" :key="msg.id" class="q-px-sm q-py-xs">
        <q-chat-message
          :name="msg.name"
          :stamp="msg.stamp"
          :sent="msg.sent"
          :bg-color="msg.sent ? 'primary' : 'grey-3'"
          :text-color="msg.sent ? 'white' : 'black'"
          class="shadow-sm"
        >
          <template #avatar>
            <q-avatar
              size="38px"
              :class="['msg-avatar', msg.sent ? 'msg-avatar--sent' : 'msg-avatar--received']"
            >
              <img :src="msg.avatar" style="object-fit: cover" />
            </q-avatar>
          </template>

          <template #default>
            <span class="bubble-text">
              <span v-for="(chunk, idx) in chunks(msg.text)" :key="msg.id + '-' + idx">
                <span
                  v-if="chunk.type === 'mention'"
                  :class="{
                    'mention-me': chunk.value === currentUserNickname,
                    'mention-text': chunk.value !== currentUserNickname,
                  }"
                >
                  @{{ chunk.value }}
                </span>

                <span v-else>{{ chunk.value }}</span>
              </span>
            </span>
          </template>
        </q-chat-message>
      </div>

      <template #loading>
        <div class="loading-banner" v-show="isLoading">
          <q-spinner-dots size="24px" />
          <span class="ml-2">Načítavam staršie správy…</span>
        </div>
      </template>
    </q-infinite-scroll>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { UiMessage } from 'src/composables/useMessages';
import { parseMentions } from 'src/utils/mentionParser';
import { api } from 'boot/api';

interface Props {
  visibleMessages: UiMessage[];
  currentUserNickname?: string | null | undefined;
  infiniteKey: number;
  isLoading: boolean;
  onLoad: (index: number, done: (finished?: boolean) => void) => void;
  channelId?: number | null;
}

const props = defineProps<Props>();

const channelMembers = ref<Set<string>>(new Set());

const fetchChannelMembers = async () => {
  if (!props.channelId) {
    channelMembers.value = new Set();
    return;
  }
  try {
    const response = await api.get(`/channels/${props.channelId}/members`);
    const memberNames = new Set<string>();
    response.data.forEach((m: { name: string; nickname?: string | null }) => {
      if (m.nickname) {
        memberNames.add(m.nickname.toLowerCase());
      }
    });
    channelMembers.value = memberNames;
  } catch {
    channelMembers.value = new Set();
  }
};

watch(() => props.channelId, fetchChannelMembers, { immediate: true });

const chunks = (text: string) => {
  const parsed = parseMentions(text);
  return parsed.map((chunk) => {
    if (chunk.type === 'mention') {
      const isRealMember = channelMembers.value.has(chunk.value.toLowerCase());
      if (!isRealMember) {
        return { type: 'text' as const, value: `@${chunk.value}` };
      }
    }
    return chunk;
  });
};
</script>

<style scoped>
.loading-banner {
  position: sticky;
  top: 0;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(2px);
  color: #2c3e50;
  font-weight: 600;
}

.bubble-text {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.mention-me {
  display: inline-block;
  padding: 0 4px;
  margin: 0 1px;
  border-radius: 4px;
  background-color: #43a047;
  color: white;
  font-weight: 600;
}

.mention-text {
  font-weight: 700;
  color: #2c3e50;
}

.msg-avatar {
  flex-shrink: 0;
}

.msg-avatar--received {
  margin-right: 8px;
}

.msg-avatar--sent {
  margin-left: 8px;
}
</style>
