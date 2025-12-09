<template>
  <div class="command-panel column full-height">
    <div class="row items-center justify-between q-mb-sm text-grey-8">
      <div class="text-caption text-bold">COMMAND LINE</div>
      <q-btn flat round dense icon="close" size="sm" @click="$emit('close')" />
    </div>

    <div ref="outputContainer" class="col term-output q-pa-sm bg-grey-9 text-green-4 shadow-inset">
      <div v-for="(line, i) in history" :key="i" class="term-line">
        <span v-if="line.type === 'input'" class="text-white">> {{ line.text }}</span>
        <span v-else :class="line.type === 'error' ? 'text-red-4' : ''">{{ line.text }}</span>
      </div>
    </div>

    <div class="q-mt-sm">
      <q-input
        v-model="cmdInput"
        dense
        outlined
        autofocus
        placeholder="Zadaj príkaz..."
        class="cmd-input"
        bg-color="white"
        @keydown.enter="executeCommand"
      >
        <template #prepend>
          <q-icon name="chevron_right" />
        </template>
      </q-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue';
import { api } from 'boot/api';

// Definícia typov
interface LogEntry {
  type: 'input' | 'output' | 'error';
  text: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const props = defineProps<{
  currentChannel: { id: number; title: string; availability: string } | null;
  currentUser: { id: number; nickname: string } | null;
  history: Array<LogEntry>;
}>();

// Definícia emitov (rodič bude počúvať na 'log' a 'clear')
const emit = defineEmits(['close', 'log', 'clear']);

const cmdInput = ref('');
const outputContainer = ref<HTMLElement | null>(null);

// Funkcia na posielanie logov do rodiča (už nemutuje props)
const log = (text: string, type: 'output' | 'error' = 'output') => {
  emit('log', { type, text });
  void scrollToBottom();
};

const scrollToBottom = async () => {
  await nextTick();
  if (outputContainer.value) {
    outputContainer.value.scrollTop = outputContainer.value.scrollHeight;
  }
};

const executeCommand = async () => {
  const raw = cmdInput.value.trim();
  if (!raw) return;

  // 1. Emitujeme vstup používateľa
  emit('log', { type: 'input', text: raw });
  cmdInput.value = '';

  await processCommand(raw);
  await scrollToBottom();
};

const processCommand = async (cmdString: string) => {
  const parts = cmdString.split(/\s+/);
  const command = (parts[0] || '').toLowerCase();
  const args = parts.slice(1);

  if (!props.currentUser) {
    log('Chyba: Nie si prihlásený.', 'error');
    return;
  }

  try {
    switch (command) {
      case '/help':
        log('=== Dostupné príkazy ===');
        log('/join [nazov] [private] - Vytvorí alebo sa pripojí ku kanálu');
        log('/invite [nick] - Pozve používateľa (alebo obnoví prístup)');
        log('/revoke [nick] - Odoberie prístup (Private, Admin only)');
        log('/kick [nick] - Vyhodí používateľa (Admin) alebo hlasuje (Public)');
        log('/cancel - Opustí kanál (Owner -> zruší kanál)');
        log('/quit - Zruší aktuálny kanál (Admin only)');
        log('/list - Otvorí zoznam členov kanála');
        log('/clear - Vymaže konzolu');
        break;

      case '/clear':
        // Emitujeme požiadavku na vymazanie
        emit('clear');
        break;

      case '/exit':
        emit('close');
        break;

      case '/join': {
        const name = args[0];
        const type = args[1];
        if (!name) {
          log('Použitie: /join <názov> [private]', 'error');
          return;
        }

        log(`Pripájam sa k ${name}...`);
        const res = await api.post('/cmd/join', {
          userId: props.currentUser.id,
          channelName: name,
          type: type,
        });
        log(res.data.message);
        // Channel will be added via WebSocket event, no reload needed
        break;
      }

      case '/list': {
        if (!props.currentChannel) {
          log('Musíš byť v kanáli.', 'error');
          return;
        }
        // Emit event to open member list
        window.dispatchEvent(new CustomEvent('openMemberList'));
        log('Zoznam členov otvorený.');
        break;
      }

      case '/invite': {
        if (!props.currentChannel) {
          log('Musíš byť v kanáli.', 'error');
          return;
        }
        const nick = args[0];
        if (!nick) {
          log('Použitie: /invite <nick>', 'error');
          return;
        }

        const res = await api.post('/cmd/invite', {
          userId: props.currentUser.id,
          channelId: props.currentChannel.id,
          targetNick: nick,
        });
        log(res.data.message);
        break;
      }

      case '/revoke': {
        if (!props.currentChannel) {
          log('Musíš byť v kanáli.', 'error');
          return;
        }
        const nick = args[0];
        if (!nick) {
          log('Použitie: /revoke <nick>', 'error');
          return;
        }

        const res = await api.post('/cmd/revoke', {
          userId: props.currentUser.id,
          channelId: props.currentChannel.id,
          targetNick: nick,
        });
        log(res.data.message);
        break;
      }

      case '/kick': {
        if (!props.currentChannel) {
          log('Musíš byť v kanáli.', 'error');
          return;
        }
        const nick = args[0];
        if (!nick) {
          log('Použitie: /kick <nick>', 'error');
          return;
        }

        const res = await api.post('/cmd/kick', {
          userId: props.currentUser.id,
          channelId: props.currentChannel.id,
          targetNick: nick,
        });
        log(res.data.message);
        break;
      }

      case '/quit': {
        if (!props.currentChannel) {
          log('Musíš byť v kanáli.', 'error');
          return;
        }
        const res = await api.post('/cmd/quit', {
          userId: props.currentUser.id,
          channelId: props.currentChannel.id,
        });
        log(res.data.message);
        setTimeout(() => window.location.reload(), 1000);
        break;
      }

      case '/cancel': {
        if (!props.currentChannel) {
          log('Musíš byť v kanáli.', 'error');
          return;
        }
        const res = await api.post('/cmd/cancel', {
          userId: props.currentUser.id,
          channelId: props.currentChannel.id,
        });
        log(res.data.message);
        setTimeout(() => window.location.reload(), 1000);
        break;
      }

      default:
        log(`Neznámy príkaz: ${command}. Skús /help`, 'error');
    }
  } catch (err: unknown) {
    // Oprava TS erroru: unknown namiesto any
    const error = err as ApiError;
    const msg = error.response?.data?.message || error.message || 'Chyba servera';
    log(`Chyba: ${msg}`, 'error');
  }
};

onMounted(() => {
  void scrollToBottom();
});

watch(
  () => props.history.length,
  () => {
    void scrollToBottom();
  },
);
</script>

<style scoped>
.term-output {
  border-radius: 8px;
  font-family: monospace;
  font-size: 13px;
  overflow-y: auto;
  scrollbar-width: none;
}
.term-output::-webkit-scrollbar {
  display: none;
}
.term-line {
  margin-bottom: 4px;
  word-break: break-all;
}
.shadow-inset {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}
</style>
