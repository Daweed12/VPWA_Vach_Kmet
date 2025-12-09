<template>
  <div class="row items-center q-gutter-sm search-wrapper">
    <q-input
      v-model="internalSearch"
      dense
      outlined
      rounded
      class="col"
      type="text"
      debounce="200"
      placeholder="Hľadať kanály..."
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>

    <q-btn
      round
      unelevated
      color="orange-7"
      text-color="white"
      icon="add"
      size="md"
      class="add-channel-btn"
      @click="emit('create-channel')"
    >
      <q-tooltip anchor="top middle" self="bottom middle"> Vytvoriť nový kanál </q-tooltip>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'create-channel'): void;
}>();

const internalSearch = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
});
</script>

<style scoped>
.search-wrapper {
  align-items: stretch;
}

.add-channel-btn {
  width: 24px;
  height: 24px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  transition:
    box-shadow 0.18s ease,
    transform 0.18s ease,
    background-color 0.18s ease;
}

.add-channel-btn:hover {
  transform: translateY(-1px) scale(1.03);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  background-color: #ff9800;
}
</style>
