<script lang="ts">
import { defineComponent, ref, computed } from 'vue';

type Status = 'online' | 'offline' | 'away' | 'dnd';
type Member = { id: number; name: string; status: Status };

export default defineComponent({
  name: 'MemberList',
  props: { modelValue: { type: Boolean, required: true } },
  emits: ['update:modelValue', 'add'],
  setup (props, { emit }) {
    const isOpen = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val)
    });

    const members = ref<Member[]>([
      { id: 1,  name: 'Jozko Mrkvicka', status: 'online'  },
      { id: 2,  name: 'Anna Hrušková',   status: 'online'  },
      { id: 3,  name: 'Peter Kôstka',    status: 'offline' },
      { id: 4,  name: 'Eva Nováková',    status: 'online'  },
      { id: 5,  name: 'Martin Kováč',    status: 'offline' },
      { id: 6,  name: 'Lucia Biela',     status: 'away'    },
      { id: 7,  name: 'Juraj Rybár',     status: 'away'    },
      { id: 8,  name: 'Mária Košíková',  status: 'offline' },
      { id: 9,  name: 'Igor Oriešok',    status: 'away'    },
      { id:10,  name: 'Jana Šipka',      status: 'dnd'     },
      { id:11,  name: 'Kamil Polesný',   status: 'dnd'     },
      { id:12,  name: 'Laura Dúhová',    status: 'online'  }
    ]);

    const getInitials = (fullName: string) =>
      fullName.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');

    const statusText = (s: Status) => {
      switch (s) {
        case 'online': return 'Online';
        case 'away': return 'Away';
        case 'dnd': return 'Do Not Disturb';
        default: return 'Offline';
      }
    };

    const statusColor = (s: Status) => {
      switch (s) {
        case 'online': return 'positive';
        case 'away': return 'warning';
        case 'dnd': return 'negative';
        default: return 'grey-6';
      }
    };

    const addMember = () => {
      emit('add');
    };

    return { isOpen, members, getInitials, statusText, statusColor, addMember };
  }
});
</script>

<template>
  <q-drawer
    v-model="isOpen"
    side="right"
    overlay
    behavior="mobile"
    :breakpoint="0"
    bordered
    :width="360"
    class="bg-orange-5 column"
  >
    <!-- Header -->
    <div class="row items-center justify-between q-pa-md" style="gap:8px">
      <div class="text-h6 text-grey-10">Members list</div>
      <div class="row items-center" style="gap:6px">
        <q-btn flat round dense icon="close" color="red-8" @click="isOpen = false" />
      </div>
    </div>

    <!-- Members grid -->
    <div class="col bg-orange-2 q-pa-lg hide-scrollbar" style="margin: 0 16px 8px 16px; border-radius: 16px; overflow-y: auto;">
      <div class="row q-col-gutter-md">
        <div class="col-4" v-for="m in members" :key="m.id">
          <div class="relative-position flex flex-center" style="height:96px;">
            <q-avatar
              size="70px"
              color="orange-1"
              text-color="blue-8"
              class="shadow-2"
              :title="`${m.name} - ${statusText(m.status)}`"
            >
              {{ getInitials(m.name) }}
              <span class="status-dot" :class="m.status" />
              <q-tooltip
                :delay="250"
                anchor="bottom middle"
                self="top middle"
                transition-show="jump-down"
                transition-hide="jump-up"
                class="bg-grey-10 text-white"
              >
                <div class="text-weight-medium">{{ m.name }}</div>
                <div class="row items-center q-mt-xs" style="gap:6px">
                  <q-badge rounded :color="statusColor(m.status)" style="width:10px;height:10px;padding:0" />
                  <span class="text-caption">{{ statusText(m.status) }}</span>
                </div>
              </q-tooltip>
            </q-avatar>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom button -->
    <div class="q-pa-md flex flex-center bg-orange-5">
      <q-btn
        color="primary"
        icon="person_add"
        label="Pridať člena"
        push
        glossy
        class="q-mt-sm"
        @click="addMember"
      >
        <q-tooltip>Pridať nového člena</q-tooltip>
      </q-btn>
    </div>
  </q-drawer>
</template>

<style scoped>
.hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }

/* farby bodiek */
.status-dot {
  position:absolute;
  right:-2px;
  bottom:-2px;
  width:14px; height:14px;
  border-radius:50%;
  border:2px solid #FEE7D7;
}
.status-dot.online  { background:#4CAF50; } /* zelená */
.status-dot.away    { background:#f2c037; } /* žltá */
.status-dot.dnd     { background:#F44336; } /* červená */
.status-dot.offline { background:#9E9E9E; } /* šedá */
</style>
