<template>
  <q-dialog v-model="isOpen" @hide="onClose">
    <q-card style="min-width: 400px; max-width: 600px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 col">Rozpísaná správa</div>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="row items-center q-mb-md">
          <q-avatar size="40px" class="q-mr-sm">
            <img :src="userAvatar || defaultAvatar" :alt="userName" />
          </q-avatar>
          <div>
            <div class="text-weight-medium">{{ userName }}</div>
            <div class="text-caption text-grey-7">píše správu...</div>
          </div>
        </div>

        <q-separator class="q-mb-md" />

        <div class="draft-content-container">
          <div v-if="draftContent" class="draft-text">{{ draftContent }}</div>
          <div v-else class="text-grey-6 text-italic">Žiadny text...</div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import defaultUserAvatar from '../assets/default_user_avatar.png';

interface Props {
  modelValue: boolean;
  userName: string;
  userAvatar?: string | undefined;
  draftContent?: string | undefined;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const isOpen = ref(props.modelValue);
const defaultAvatar = defaultUserAvatar;

watch(
  () => props.modelValue,
  (newVal) => {
    isOpen.value = newVal;
  },
);

watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal);
});

// Realtime update - content sa automaticky aktualizuje cez props
watch(
  () => props.draftContent,
  (newContent) => {
    // Content sa automaticky aktualizuje v template
    console.log('Draft content updated:', newContent);
  },
  { immediate: true },
);

const onClose = () => {
  isOpen.value = false;
};
</script>

<style scoped>
.draft-content-container {
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.draft-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.draft-content-container::-webkit-scrollbar {
  width: 6px;
}

.draft-content-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.draft-content-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.draft-content-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

