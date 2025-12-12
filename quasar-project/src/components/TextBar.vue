<template>
  <div class="text-bar row items-center">
    <div class="col relative-position">
      <q-input
        ref="inputRef"
        v-model="message"
        borderless
        placeholder="Napíš správu..."
        @keyup.enter="sendMessage"
        @input="handleInput"
        @keydown="handleKeyDown"
        class="col"
      />
      <q-menu
        v-model="showMentionMenu"
        :target="false"
        fit
        no-parent-event
        class="mention-menu"
        max-height="200"
        anchor="top left"
        self="top left"
      >
        <q-list dense>
          <q-item
            v-for="member in filteredMembers"
            :key="member.id"
            clickable
            v-close-popup
            @click="selectMember(member)"
            :class="{ 'mention-item-selected': selectedMemberIndex === filteredMembers.indexOf(member) }"
          >
            <q-item-section avatar>
              <q-avatar size="32px">
                <img :src="getAvatarUrl(member.profilePicture)" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ member.name }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="filteredMembers.length === 0">
            <q-item-section>
              <q-item-label class="text-grey-6">Žiadni používatelia</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </div>
    <q-btn round color="primary" icon="emoji_emotions" class="q-ml-sm" aria-label="Otvoriť emoji">
      <q-menu ref="emojiMenuRef" anchor="top right" self="bottom right" :offset="[0, 8]" fit>
        <div class="q-pa-sm" style="max-width: 260px">
          <div class="text-caption text-grey-7 q-mb-xs">Emoji</div>
          <div class="row q-col-gutter-xs">
            <div v-for="e in emojis" :key="e" class="col-2 flex flex-center">
              <q-btn flat round dense class="emoji-btn" @click="addEmoji(e)">
                <span class="text-h6">{{ e }}</span>
              </q-btn>
            </div>
          </div>
        </div>
      </q-menu>
    </q-btn>

    <q-btn round color="primary" icon="send" class="q-ml-sm" @click="sendMessage" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick } from 'vue';
import type { QInput } from 'quasar';
import { api } from 'boot/api';

interface Member {
  id: number;
  name: string;
  profilePicture?: string | null;
}

export default defineComponent({
  name: 'TextBar',
  props: {
    channelId: {
      type: Number as () => number | null,
      default: null,
    },
  },
  emits: ['send', 'typing'],
  setup(props, { emit }) {
    const message = ref('');
    const inputRef = ref<QInput | null>(null);
    const emojiMenuRef = ref();
    const showMentionMenu = ref(false);
    const members = ref<Member[]>([]);
    const mentionStartPos = ref(-1);
    const mentionQuery = ref('');
    const selectedMemberIndex = ref(0);

    let typingTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastTypingEmit = 0;

    const emojis = [
      '😀',
      '😁',
      '😂',
      '🤣',
      '😊',
      '😍',
      '😎',
      '🤔',
      '😅',
      '🙃',
      '😉',
      '😇',
      '😭',
      '😴',
      '🤯',
      '🥳',
      '👍',
      '👏',
      '🙌',
      '🔥',
      '🎉',
      '💡',
      '🚀',
      '❤️',
      '💪',
      '🙏',
      '👀',
      '🤝',
      '⚡',
      '📷',
    ];

    const focusInput = () => {
      inputRef.value?.focus();
    };

    const addEmoji = (e: string) => {
      if (message.value && !/\s$/.test(message.value)) message.value += ' ';
      message.value += e;
      emojiMenuRef.value?.hide();
      setTimeout(focusInput, 0);
      handleTyping();
    };

    const defaultUserAvatar = new URL('../assets/default_user_avatar.png', import.meta.url).href;

    const getAvatarUrl = (path: string | null | undefined): string => {
      if (!path) return defaultUserAvatar;
      if (path.startsWith('http')) return path;
      const baseUrl = (api.defaults.baseURL as string) || 'http://localhost:3333';
      const cleanBase = baseUrl.replace(/\/$/, '');
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${cleanBase}${cleanPath}`;
    };

    const fetchMembers = async () => {
      if (!props.channelId) {
        members.value = [];
        return;
      }
      try {
        const response = await api.get(`/channels/${props.channelId}/members`);
        members.value = response.data.map((m: { id: number; name: string; profilePicture?: string | null }) => ({
          id: m.id,
          name: m.name,
          profilePicture: m.profilePicture || null,
        }));
      } catch {
        members.value = [];
      }
    };

    watch(() => props.channelId, fetchMembers, { immediate: true });

    const filteredMembers = computed(() => {
      if (!mentionQuery.value) {
        return members.value;
      }
      const query = mentionQuery.value.toLowerCase();
      return members.value.filter((m) => m.name.toLowerCase().includes(query));
    });

    const findMentionPosition = (text: string, cursorPos: number): { start: number; end: number } | null => {
      let start = cursorPos - 1;
      while (start >= 0 && /[\w-]/.test(text[start] || '')) {
        start--;
      }
      if (start >= 0 && text[start] === '@') {
        const end = cursorPos;
        return { start, end };
      }
      return null;
    };

    const handleInput = () => {
      handleTyping();
      const input = inputRef.value?.$el?.querySelector('input') as HTMLInputElement;
      if (!input) return;

      const cursorPos = input.selectionStart || 0;
      const mentionPos = findMentionPosition(message.value, cursorPos);

      if (mentionPos) {
        mentionStartPos.value = mentionPos.start;
        mentionQuery.value = message.value.substring(mentionPos.start + 1, mentionPos.end);
        selectedMemberIndex.value = 0;
        showMentionMenu.value = true;
        void nextTick(() => {
          updateMentionMenuPosition();
        });
      } else {
        showMentionMenu.value = false;
        mentionStartPos.value = -1;
        mentionQuery.value = '';
      }
    };

    const updateMentionMenuPosition = () => {
      void nextTick(() => {
        const input = inputRef.value?.$el?.querySelector('input') as HTMLInputElement;
        if (!input || !showMentionMenu.value) return;

        const rect = input.getBoundingClientRect();
        const menu = document.querySelector('.mention-menu') as HTMLElement;
        if (menu) {
          menu.style.position = 'fixed';
          menu.style.top = `${rect.bottom + 8}px`;
          menu.style.left = `${rect.left}px`;
          menu.style.width = `${Math.max(rect.width, 250)}px`;
          menu.style.zIndex = '9999';
        }
      });
    };

    const selectMember = (member: Member) => {
      if (mentionStartPos.value === -1) return;

      const before = message.value.substring(0, mentionStartPos.value);
      const after = message.value.substring(mentionStartPos.value + 1 + mentionQuery.value.length);
      message.value = `${before}@${member.name} ${after}`;

      showMentionMenu.value = false;
      mentionStartPos.value = -1;
      mentionQuery.value = '';

      setTimeout(() => {
        const input = inputRef.value?.$el?.querySelector('input') as HTMLInputElement;
        if (input) {
          const newPos = before.length + member.name.length + 2;
          input.setSelectionRange(newPos, newPos);
          input.focus();
        }
      }, 0);

      handleTyping();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (showMentionMenu.value) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          selectedMemberIndex.value = Math.min(selectedMemberIndex.value + 1, filteredMembers.value.length - 1);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          selectedMemberIndex.value = Math.max(selectedMemberIndex.value - 1, 0);
        } else if (event.key === 'Enter' && filteredMembers.value.length > 0) {
          event.preventDefault();
          const selectedMember = filteredMembers.value[selectedMemberIndex.value];
          if (selectedMember) {
            selectMember(selectedMember);
          }
        } else if (event.key === 'Escape') {
          showMentionMenu.value = false;
          mentionStartPos.value = -1;
          mentionQuery.value = '';
        } else {
          handleTyping();
        }
      } else {
        handleTyping();
      }
    };

    const handleTyping = () => {
      const now = Date.now();
      if (now - lastTypingEmit < 200) return;
      lastTypingEmit = now;

      emit('typing', true, message.value);

      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      typingTimeout = setTimeout(() => {
        emit('typing', false);
        typingTimeout = null;
      }, 2000);
    };

    const sendMessage = () => {
      if (message.value.trim() === '') return;

      // Stop typing indicator
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
      }
      emit('typing', false);

      emit('send', message.value);
      message.value = '';
      focusInput();
    };

    return {
      message,
      emojis,
      addEmoji,
      sendMessage,
      handleTyping,
      handleInput,
      handleKeyDown,
      inputRef,
      emojiMenuRef,
      showMentionMenu,
      filteredMembers,
      selectedMemberIndex,
      selectMember,
      getAvatarUrl,
    };
  },
});
</script>

<style scoped>
.text-bar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.emoji-btn {
  width: 40px;
  height: 40px;
  line-height: 1;
}

.mention-menu {
  max-width: 300px;
}

.mention-item-selected {
  background-color: rgba(25, 118, 210, 0.1);
}
</style>
