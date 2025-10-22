<template>
  <div>
    <q-toolbar class="text-grey-9">
      <q-btn dense flat round icon="menu" @click="toggleLeft" />
      <q-toolbar-title>{{ title }}</q-toolbar-title>
      <q-space />
      <q-btn
        v-if="showClose"
        dense flat round icon="close"
        @click="$emit('close')"
      />
      <q-btn
        v-if="showInvite"
        dense flat round icon="person_add"
        @click="$emit('add-person')"
      />
      <q-btn
        v-if="showMembers"
        dense flat round icon="group"
        @click="toggleMemberDrawer"
      />
    </q-toolbar>

    <!-- RIGHT DRAWER S MEMBER LISTOM -->
    <q-drawer
      v-model="drawerOpen"
      side="right"
      bordered
      overlay
      :width="140"
      class="bg-orange-5"
    >
      <MemberList
        :members="members"
        @add="onAddMember"
        @select="onSelectMember"
      />
    </q-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MemberList from 'components/MemberList.vue'

const props = withDefaults(defineProps<{
  title?: string
  showClose?: boolean
  showInvite?: boolean
  showMembers?: boolean
}>(), {
  title: 'Conversation of channel',
  showClose: true,
  showInvite: true,
  showMembers: true
})

defineEmits<{
  (e: 'toggle-left'): void
  (e: 'close'): void
  (e: 'add-person'): void
}>()

const drawerOpen = ref(false)

function toggleLeft() {
  // prepína ľavý drawer
  emit('toggle-left')
}

function toggleMemberDrawer() {
  drawerOpen.value = !drawerOpen.value
}

// DEMO DÁTA členov (v praxi si to načítaš z backendu)
const members = ref([
  { id: 1, name: 'Sofia Novak', status: 'online' },
  { id: 2, name: 'Peter Kováč', status: 'dnd' },
  { id: 3, name: 'Marek Hruška', status: 'away' },
  { id: 4, name: 'Lucia Vargová', status: 'online' },
  { id: 5, name: 'Tibor M.', status: 'offline' },
  { id: 6, name: 'Zuzana H.', status: 'online' },
])

function onAddMember() {
  console.log('Klikol si na pridanie člena')
}

function onSelectMember(m: any) {
  console.log('Vybraný člen:', m)
}
</script>
