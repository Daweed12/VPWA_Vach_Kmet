<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'AddUserToChannel',
  emits: ['close'],
  setup(_, { emit }) {
    // statické pole na ukážku; zatiaľ bez logiky
    const query = ref('');
    const role = ref<'member' | 'admin'>('member');

    const close = () => emit('close');

    return { query, role, close };
  }
});
</script>

<template>
  <q-card style="min-width: 520px; max-width: 90vw;">
    <q-card-section class="row items-center justify-between">
      <div class="text-h6">Pridať používateľa do kanálu</div>
      <q-btn flat round dense icon="close" @click="close" />
    </q-card-section>

    <q-separator />

    <q-card-section class="q-gutter-md">
      <q-input
        v-model="query"
        label="Zadaj nickname alebo e-mail"
        placeholder="Zadaj meno alebo e-mail…"
        filled
        dense
        clearable
        autofocus
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>



      <!-- statická ukážka “nájdeného” výsledku -->
      <div class="q-pa-sm bg-grey-2 rounded-borders">
        <div class="text-subtitle2 q-mb-xs">Návrhy</div>
        <div class="row items-center q-gutter-sm">
          <q-avatar color="primary" text-color="white">AM</q-avatar>
          <div class="col">
            <div class="text-body1">Adam Mráz</div>
            <div class="text-caption text-grey-7">adam.mraz@example.com</div>
          </div>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right">
      <q-btn flat label="Zrušiť" @click="close" />
      <q-btn color="primary" label="Pridať" :disable="!query" @click="close" />
    </q-card-actions>
  </q-card>
</template>

<style scoped>
.rounded-borders { border-radius: 12px; }
</style>
