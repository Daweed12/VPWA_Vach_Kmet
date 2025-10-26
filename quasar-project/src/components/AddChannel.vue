<template>
  <q-card class="q-dialog-plugin" style="min-width: 520px">
    <q-card-section>
      <div class="text-h6">Vytvoriť kanál</div>
      <div class="text-caption text-grey-7">Pomenuj kanál, zvoľ viditeľnosť a pridaj členov.</div>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-gutter-md">
      <q-input
        v-model="name"
        label="Názov kanála"
        filled
        :rules="[val => !!val || 'Zadaj názov', nameRule]"
        @keyup.enter="trySubmit"
        hint="Zadaj názov kanála (aspoň 2 znaky)"
      />

      <q-select
        v-model="selectedMemberIds"
        :options="filteredOptions"
        option-value="id"
        option-label="name"
        use-input
        input-debounce="200"
        @filter="filterFn"
        filled
        multiple
        use-chips
        emit-value
        map-options
        clear-icon="close"
        label="Pridať členov"
        hint="Začni písať nickname alebo meno…"
        :popup-content-style="{ maxHeight: '300px' }"
      >
        <template #option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section avatar>
              <q-avatar size="28px">
                <img v-if="scope.opt.avatar" :src="scope.opt.avatar || ''" alt="" />
                <span v-else>{{ initials(scope.opt.name) }}</span>
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ scope.opt.name }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>

        <template #selected-item="scope">
          <q-chip
            removable
            @remove="scope.removeAtIndex(scope.index)"
            :tabindex="scope.tabindex"
            class="q-ma-xs"
          >
            <q-avatar v-if="byId(scope.opt)?.avatar" size="20px">
              <img :src="byId(scope.opt)?.avatar || ''" alt="" />
            </q-avatar>
            <template v-else>
              {{ initials(byId(scope.opt)?.name || '') }}
            </template>
            <span class="q-ml-xs">{{ byId(scope.opt)?.name }}</span>
          </q-chip>
        </template>
      </q-select>

      <div class="row items-center">
        <q-toggle v-model="isPrivate" color="primary" label="Súkromný kanál" />
        <div class="text-caption text-grey-7 q-ml-md">
          {{ isPrivate ? 'Len pozvaní členovia uvidia kanál.' : 'Kanál je viditeľný pre všetkých v tíme.' }}
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right">
      <q-btn flat color="grey" label="Zrušiť" @click="emit('close')" />
      <q-btn
        flat
        color="primary"
        label="Vytvoriť"
        :disable="!isFormValid"
        @click="submit"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

type UserOption = { id: number; name: string; avatar?: string }

const props = defineProps<{
  initialName?: string
  initialPrivate?: boolean
  users?: UserOption[]
  initialMemberIds?: number[]
}>()

const emit = defineEmits<{
  (e: 'submit', payload: { name: string; isPrivate: boolean; memberIds: number[] }): void
  (e: 'close'): void
}>()

const name = ref(props.initialName ?? '')
const isPrivate = ref(props.initialPrivate ?? false)
const selectedMemberIds = ref<number[]>([...(props.initialMemberIds ?? [])])

const nameRule = (val: string) => (val?.trim().length >= 2) || 'Minimálne 2 znaky'
const isFormValid = computed(() => name.value.trim().length >= 2)

const allUsers = computed<UserOption[]>(() => props.users ?? [])
const filteredOptions = ref<UserOption[]>(allUsers.value)

function filterFn (val: string, update: (cb: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase().trim()
    filteredOptions.value =
      !needle
        ? allUsers.value
        : allUsers.value.filter(u => u.name.toLowerCase().includes(needle))
  })
}

const byId = (id?: number) => allUsers.value.find(u => u.id === id)
const initials = (fullName: string) =>
  fullName.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')

function submit () {
  if (!isFormValid.value) return
  emit('submit', {
    name: name.value.trim(),
    isPrivate: isPrivate.value,
    memberIds: [...selectedMemberIds.value]
  })
}

function trySubmit () {
  if (isFormValid.value) submit()
}
</script>
