<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { api } from 'boot/api'; // Dôležitý import pre adresu servera
import defaultChannelLogo from 'src/assets/default_channel_logo.png';

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
    imageUrl: {
      type: String,
      default: '',
    },
    channelId: {
      type: Number,
      default: undefined,
    },
    isOwner: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['accept', 'reject', 'click', 'leave', 'delete'],

  setup(props, { emit }) {
    const contextMenuOpen = ref(false);
    const badgeColor = computed(() => (props.availability === 'private' ? 'red' : 'green'));

    const badgeText = computed(() => (props.availability === 'private' ? 'private' : 'public'));

    // --- NOVÁ LOGIKA PRE OBRÁZKY ---
    const finalImageUrl = computed(() => {
      // 1. Ak nemáme URL, vrátime default
      if (!props.imageUrl) return defaultChannelLogo;

      // 2. Ak je to externý link (https://...), vrátime ho
      if (props.imageUrl.startsWith('http')) return props.imageUrl;

      // 3. Inak vyskladáme cestu k backendu
      const baseUrl = (api.defaults.baseURL as string) || 'http://localhost:3333';

      // Očistíme URL od prebytočných lomiek
      const cleanBase = baseUrl.replace(/\/$/, '');
      const cleanPath = props.imageUrl.startsWith('/') ? props.imageUrl : `/${props.imageUrl}`;

      return `${cleanBase}${cleanPath}`;
    });
    // -------------------------------

    const handleClick = () => {
      // Zatvoriť menu ak je otvorené
      if (contextMenuOpen.value) {
        contextMenuOpen.value = false;
        return;
      }
      emit('click');
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (!props.isInvite) {
        event.preventDefault();
        event.stopPropagation();
        contextMenuOpen.value = true;
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      // Zatvoriť menu pri ľavom kliknutí
      if (event.button === 0 && contextMenuOpen.value) {
        contextMenuOpen.value = false;
      }
    };

    const acceptInvite = () => {
      emit('accept');
    };

    const rejectInvite = () => {
      emit('reject');
    };

    const handleLeave = () => {
      contextMenuOpen.value = false;
      emit('leave');
    };

    const handleDelete = () => {
      contextMenuOpen.value = false;
      emit('delete');
    };

    return {
      badgeColor,
      badgeText,
      finalImageUrl,
      handleClick,
      acceptInvite,
      rejectInvite,
      handleLeave,
      handleDelete,
      handleContextMenu,
      handleMouseDown,
      contextMenuOpen,
      defaultChannelLogo,
    };
  },
});
</script>

<template>
  <q-item
    :class="isInvite ? 'invite-item bg-orange-8' : 'channel-item bg-orange-1'"
    clickable
    v-ripple
    @click="handleClick"
    @mousedown="handleMouseDown"
    @contextmenu.prevent="handleContextMenu"
  >
    <q-item-section avatar class="q-mr-sm">
      <q-avatar rounded size="32px">
        <img
          :src="finalImageUrl"
          alt="Channel avatar"
          style="object-fit: cover"
          @error="
            (e) => {
              (e.target as HTMLImageElement).src = defaultChannelLogo;
            }
          "
        />
      </q-avatar>
    </q-item-section>

    <q-item-section
      :class="isInvite ? 'text-white text-weight-bold' : 'text-black text-weight-bold'"
    >
      {{ name }}
    </q-item-section>

    <q-badge
      v-if="!isInvite"
      :color="badgeColor"
      class="q-ml-sm text-white text-uppercase"
      align="middle"
    >
      {{ badgeText }}
    </q-badge>

    <q-item-section v-if="isInvite" side>
      <div class="row items-center">
        <q-btn flat round dense icon="check" color="white" size="md" @click.stop="acceptInvite" />
        <q-btn flat round dense icon="close" color="white" size="md" @click.stop="rejectInvite" />
      </div>
    </q-item-section>

    <q-menu v-model="contextMenuOpen" :offset="[0, 5]" touch-position no-parent-event>
      <q-list style="min-width: 200px">
        <q-item v-if="!isOwner" clickable v-close-popup @click="handleLeave">
          <q-item-section avatar>
            <q-icon name="exit_to_app" />
          </q-item-section>
          <q-item-section>Opustiť kanál</q-item-section>
        </q-item>

        <q-item
          v-if="isOwner"
          clickable
          v-close-popup
          @click="handleDelete"
          class="text-negative"
        >
          <q-item-section avatar>
            <q-icon name="delete" color="negative" />
          </q-item-section>
          <q-item-section>Zrušiť kanál</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
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
