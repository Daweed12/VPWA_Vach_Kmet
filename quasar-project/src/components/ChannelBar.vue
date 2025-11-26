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
      type: String,
      default: 'public',
    },
    isInvite: {
      type: Boolean,
      default: false,
    },
    // tu príde cesta z DB (imagine_path)
    imageUrl: {
      type: String,
      default: '',
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

    const hasImage = computed(() => !!props.imageUrl)

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
      hasImage,
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
    <!-- AVATAR KANÁLA VĽAVO -->
    <q-item-section avatar class="q-mr-sm">
      <q-avatar rounded size="32px">
        <!-- ak máme cestu, zobrazíme obrázok -->
        <img
          v-if="hasImage"
          :src="imageUrl"
          alt="Channel avatar"
        >
        <!-- inak fallback ikonka -->
        <q-icon
          v-else
          name="forum"
        />
      </q-avatar>
    </q-item-section>

    <!-- názov kanála -->
    <q-item-section
      :class="isInvite ? 'text-white text-weight-bold' : 'text-black text-weight-bold'"
    >
      {{ name }}
    </q-item-section>

    <!-- badge PUBLIC / PRIVATE -->
    <q-badge
      v-if="!isInvite"
      :color="badgeColor"
      class="q-ml-sm text-white text-uppercase"
      align="middle"
    >
      {{ badgeText }}
    </q-badge>

    <!-- invite – accept / reject -->
    <q-item-section v-if="isInvite" side>
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
