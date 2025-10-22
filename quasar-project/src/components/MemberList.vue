<!-- src/components/MemberList.vue -->
<template>
  <div class="member-list bg-orange-5">
    <q-scroll-area class="fit content-area">
      <div class="member-grid">
        <div
          v-for="m in members"
          :key="m.id ?? m.name"
          class="member-item"
        >
          <q-avatar
            :size="avatarSize"
            color="orange-1"
            text-color="grey-9"
            class="relative-position cursor-pointer"
            @click="$emit('select', m)"
            :src="m.avatarUrl"
          >
            <template v-if="!m.avatarUrl">{{ initials(m.name) }}</template>

            <!-- status dot -->
            <span
              class="status-dot"
              :class="statusClass(m.status)"
            />
          </q-avatar>

          <q-tooltip anchor="top middle" self="bottom middle">
            {{ m.name }} • {{ (m.status || 'offline').toUpperCase() }}
          </q-tooltip>
        </div>
      </div>
    </q-scroll-area>

    <!-- add members btn -->
    <q-btn
      dense
      round
      icon="group_add"
      color="orange-1"
      class="add-fab"
      @click="$emit('add')"
    />
  </div>
</template>

<script setup lang="ts">
type Status = 'online' | 'offline' | 'dnd' | 'away'

interface Member {
  id?: string | number
  name: string
  avatarUrl?: string
  status?: Status
}

const props = withDefaults(defineProps<{
  members: Member[]
  avatarSize?: string
}>(), {
  members: () => [],
  avatarSize: '44px'
})

defineEmits<{
  (e: 'select', m: Member): void
  (e: 'add'): void
}>()

const initials = (name: string) =>
  name.split(' ')
    .map(p => p[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')

const statusClass = (s?: Status) => {
  switch (s) {
    case 'online': return 'online'
    case 'dnd':    return 'dnd'
    case 'away':   return 'away'
    default:       return 'offline'
  }
}
</script>

<style scoped>
.member-list {
  position: relative;
  border-radius: 16px;
  padding: 8px;
  height: 100%;
  min-width: 86px;
  box-shadow: inset 0 0 0 2px rgba(255,255,255,0.25);
}

/* scroll area fills the card */
.content-area { border-radius: 12px; }

/* responsive grid roughly like the mock (3 per riadok na úzkych) */
.member-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 12px;
  padding: 2px 2px 36px; /* spodný padding kvôli FAB */
}

/* status dot styling */
.status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #FDEFD9; /* svetlá oranžová, aby ladilo */
}

/* farby stavov */
.status-dot.online  { background: #4CAF50; }  /* green */
.status-dot.dnd     { background: #F44336; }  /* red */
.status-dot.away    { background: #9E9E9E; }  /* grey */
.status-dot.offline { background: #BDBDBD; }  /* light grey */

/* mini add button vpravo dole v rámci panelu */
.add-fab {
  position: absolute;
  right: 6px;
  bottom: 6px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
</style>
