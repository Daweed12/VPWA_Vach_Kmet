<script lang="ts">
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'ChannelBar',
  props: {
    name: {
      type: String,
      required: true,
    },
    availability: {
      // tu neriešime union typ, nech je to obyčajný string
      type: String,
      default: 'public',
    },
    isInvite: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['accept', 'reject', 'click'],

  setup (props, { emit }) {
    const badgeColor = computed(() =>
      props.availability === 'private' ? 'red' : 'green',
    )

    const badgeText = computed(() =>
      props.availability === 'private' ? 'private' : 'public',
    )

    const handleClick = () => {
      emit('click')
    }

    const acceptInvite = () => {
      emit('accept')
    }

    const rejectInvite = () => {
      emit('reject')
    }

    return {
      badgeColor,
      badgeText,
      handleClick,
      acceptInvite,
      rejectInvite,
    }
  },
})
</script>

<template>
  <q-item
    :class="isInvite ? 'invite-item bg-orange-8' : 'channel-item bg-orange-1'"
    clickable
    v-ripple
    @click="handleClick"
  >
    <q-item-section
      :class="isInvite ? 'text-white text-weight-bold' : 'text-black text-weight-bold'"
    >
      {{ name }}
    </q-item-section>

    <!-- Badge len pre normálne kanály -->
    <q-badge
      v-if="!isInvite"
      :color="badgeColor"
      class="q-ml-sm text-white text-uppercase"
      align="middle"
    >
      {{ badgeText }}
    </q-badge>

    <!-- Ak to NIE je invite – ikony person_add a close -->
    <q-item-section v-if="!isInvite" side>
      <div class="row items-center">
        <q-btn flat round dense icon="person_add" color="orange-8" size="md" />
        <q-btn flat round dense icon="close" color="red-8" size="md" />
      </div>
    </q-item-section>

    <!-- Ak je to invite – check / close s emitmi -->
    <q-item-section v-else side>
      <div class="row items-center">
        <q-btn
          flat
          round
          dense
          icon="check"
          color="white"
          size="md"
          @click.stop="acceptInvite"
        />
        <q-btn
          flat
          round
          dense
          icon="close"
          color="white"
          size="md"
          @click.stop="rejectInvite"
        />
      </div>
    </q-item-section>
  </q-item>
</template>

<style scoped>
.channel-item,
.invite-item {
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
  background-color: #ffcc80 !important;
}

.invite-item:hover {
  background-color: #ef6c00 !important;
}

.channel-item .q-item__section--main,
.invite-item .q-item__section--main {
  font-size: 1.1em;
}

.channel-item .q-item__section--side,
.invite-item .q-item__section--side {
  padding-left: 10px;
}
</style>
