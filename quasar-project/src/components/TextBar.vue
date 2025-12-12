<template>
  <div class="text-bar row items-center">
    <div class="col relative-position">
      <q-input
        ref="inputRef"
        v-model="message"
        borderless
        placeholder="Napíš správu..."
        @keyup.enter="handleEnter"
        @input="handleInput"
        @keydown="handleKeyDown"
        @keyup="handleKeyUp"
        class="col"
      />
      <Teleport to="body">
        <div
          v-if="showMentionMenu && mentionStartPos >= 0 && filteredMembers.length > 0"
          ref="mentionMenuRef"
          class="mention-menu"
          :style="mentionMenuStyle"
        >
          <q-list dense class="mention-list">
            <q-item
              v-for="(member, index) in filteredMembers"
              :key="member.id"
              clickable
              @click="selectMember(member)"
              :class="{ 'mention-item-selected': selectedMemberIndex === index }"
              class="mention-item"
            >
              <q-item-section avatar>
                <q-avatar size="36px">
                  <img :src="getAvatarUrl(member.profilePicture)" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="mention-name">{{ member.name }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </Teleport>
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
import { Teleport } from 'vue';
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
    const mentionMenuRef = ref<HTMLElement | null>(null);
    const showMentionMenu = ref(false);
    const members = ref<Member[]>([]);
    const mentionStartPos = ref(-1);
    const mentionQuery = ref('');
    const selectedMemberIndex = ref(0);
    
    watch(() => message.value, () => {
      if (message.value.length === 0) {
        showMentionMenu.value = false;
        mentionStartPos.value = -1;
        mentionQuery.value = '';
      }
    });
    const mentionMenuStyle = ref<Record<string, string>>({
      position: 'fixed',
      top: '0px',
      left: '0px',
      width: '250px',
      zIndex: '9999',
      maxHeight: '250px',
      overflowY: 'auto',
    });

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
        members.value = response.data.map((m: { id: number; name: string; nickname?: string | null; profilePicture?: string | null }) => ({
          id: m.id,
          name: m.nickname || m.name,
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
      return members.value.filter((m) => m.name.toLowerCase().startsWith(query));
    });

    const findMentionPosition = (text: string, cursorPos: number): { start: number; end: number } | null => {
      if (cursorPos === 0 || text.length === 0) return null;
      
      let start = cursorPos - 1;
      
      while (start >= 0 && /[\w-]/.test(text[start] || '')) {
        start--;
      }
      
      if (start >= 0 && text[start] === '@') {
        let end = cursorPos;
        while (end < text.length && /[\w-]/.test(text[end] || '')) {
          end++;
        }
        return { start, end };
      }
      
      if (cursorPos > 0 && text[cursorPos - 1] === '@') {
        return { start: cursorPos - 1, end: cursorPos };
      }
      
      return null;
    };

    const handleInput = () => {
      handleTyping();
      
      void nextTick(() => {
        const input = inputRef.value?.$el?.querySelector('input') as HTMLInputElement;
        if (!input) {
          showMentionMenu.value = false;
          mentionStartPos.value = -1;
          mentionQuery.value = '';
          return;
        }

        const cursorPos = input.selectionStart || 0;
        const mentionPos = findMentionPosition(message.value, cursorPos);

        if (mentionPos && props.channelId) {
          mentionStartPos.value = mentionPos.start;
          mentionQuery.value = message.value.substring(mentionPos.start + 1, mentionPos.end);
          selectedMemberIndex.value = 0;
          
          if (members.value.length > 0) {
            showMentionMenu.value = true;
            updateMentionMenuPosition();
          } else {
            showMentionMenu.value = false;
          }
        } else {
          showMentionMenu.value = false;
          mentionStartPos.value = -1;
          mentionQuery.value = '';
        }
      });
    };

    const updateMentionMenuPosition = () => {
      const input = inputRef.value?.$el?.querySelector('input') as HTMLInputElement;
      if (!input || !showMentionMenu.value) return;

      const rect = input.getBoundingClientRect();
      mentionMenuStyle.value = {
        position: 'fixed',
        top: `${rect.top - 8}px`,
        left: `${rect.left}px`,
        width: `${Math.max(rect.width, 250)}px`,
        zIndex: '99999',
        maxHeight: '250px',
        overflowY: 'auto',
        transform: 'translateY(-100%)',
      };
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

    const handleEnter = () => {
      if (showMentionMenu.value && filteredMembers.value.length > 0) {
        const selectedMember = filteredMembers.value[selectedMemberIndex.value];
        if (selectedMember) {
          selectMember(selectedMember);
          return;
        }
      }
      sendMessage();
    };

    const handleKeyUp = () => {
      handleInput();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (showMentionMenu.value) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          selectedMemberIndex.value = Math.min(selectedMemberIndex.value + 1, filteredMembers.value.length - 1);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          selectedMemberIndex.value = Math.max(selectedMemberIndex.value - 1, 0);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          showMentionMenu.value = false;
          mentionStartPos.value = -1;
          mentionQuery.value = '';
        } else if (event.key === 'Backspace') {
          if (mentionQuery.value.length === 0 && mentionStartPos.value >= 0) {
            showMentionMenu.value = false;
            mentionStartPos.value = -1;
            mentionQuery.value = '';
          }
        }
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

      showMentionMenu.value = false;
      mentionStartPos.value = -1;
      mentionQuery.value = '';

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
      Teleport,
      message,
      emojis,
      addEmoji,
      sendMessage,
      handleTyping,
      handleInput,
      handleKeyDown,
      handleKeyUp,
      handleEnter,
      inputRef,
      emojiMenuRef,
      mentionMenuRef,
      showMentionMenu,
      mentionMenuStyle,
      mentionStartPos,
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
  position: fixed !important;
  max-width: 320px;
  min-width: 250px;
  background: white !important;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 99999 !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.mention-list {
  padding: 4px;
}

.mention-item {
  border-radius: 6px;
  margin: 2px 0;
  transition: background-color 0.15s ease;
}

.mention-item:hover {
  background-color: rgba(255, 152, 0, 0.1);
}

.mention-item-selected {
  background-color: rgba(255, 152, 0, 0.2);
}

.mention-item-selected:hover {
  background-color: rgba(255, 152, 0, 0.25);
}

.mention-name {
  font-weight: 500;
  font-size: 14px;
  color: #2c3e50;
}

.mention-item-empty {
  padding: 12px 16px;
}
</style>
