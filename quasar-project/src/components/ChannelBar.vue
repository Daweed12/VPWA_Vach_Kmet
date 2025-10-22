<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ChannelBar',
  props: {
    name: {
      type: String,
      required: true
    }
  }
})
</script>

<template>
  <q-item class="channel-item bg-orange-1" clickable v-ripple>
    <q-item-section class="text-black text-weight-bold">
      {{ name }}
    </q-item-section>
    <q-item-section side>
      <div class="row items-center">
        <q-btn flat round dense icon="person_add" color="orange-8" size="md" />
        <q-btn flat round dense icon="close" color="red-8" size="md" />
      </div>
    </q-item-section>
  </q-item>
</template>

<style scoped>
.channel-item {
  border-radius: 15px;
  min-height: 50px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
  transition: background-color 0.2s ease;
}

.channel-item:hover {
  background-color: #ffcc80; /* jemné zvýraznenie po prechode myšou */
}

.channel-item .q-item__section--main {
  font-size: 1.1em;
}

.channel-item .q-item__section--side {
  padding-left: 10px;
}
</style>
