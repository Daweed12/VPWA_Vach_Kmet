<script setup lang="ts">
import { ref, watch } from 'vue'
import AddChannelComponent from 'components/AddChannel.vue'

type ChannelCreatePayload = {
  name: string
  isPrivate: boolean
  memberIds: number[]
}

const emit = defineEmits<{
  (e: 'add-channel', payload: ChannelCreatePayload): void
  (e: 'search', text: string): void
}>()


const allUsers = ref([
  { id: 1, name: 'Jozko Mrkvička' },
  { id: 2, name: 'Anna Hrušková' },
  { id: 3, name: 'Peter Kôstka' },
  { id: 4, name: 'Eva Nováková' },
  { id: 5, name: 'Martin Kováč' }
])

const searchText = ref('')
const showAddDialog = ref(false)

function openAddChannelModal () {
  showAddDialog.value = true
}
function handleSubmit (payload: ChannelCreatePayload) {
  emit('add-channel', payload)
  showAddDialog.value = false
}

watch(searchText, (val: string) => emit('search', val))
</script>

<template>
  <div class="search-bar-container q-mb-lg">
    <q-input
      outlined
      dense
      placeholder="Hľadať kanály..."
      bg-color="white"
      debounce="300"
      v-model="searchText"
    >
      <template #prepend>
        <q-icon name="search" color="grey-6" />
      </template>
    </q-input>

    <q-btn
      round
      dense
      icon="add"
      color="orange-8"
      size="lg"
      class="add-channel-btn"
      @click="openAddChannelModal"
    />
  </div>

  <q-dialog
    v-model="showAddDialog"
    persistent
    transition-show="scale"
    transition-hide="scale"
  >
    <AddChannelComponent
      :users="allUsers"
      @submit="handleSubmit"
      @close="showAddDialog = false"
    />
  </q-dialog>
</template>

<style scoped>
.search-bar-container {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.add-channel-btn {
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
}

</style>
