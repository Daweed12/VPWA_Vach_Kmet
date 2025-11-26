<template>
  <div class="command-panel column full-height">
    <div class="row items-center justify-between q-mb-sm text-grey-8">
      <div class="text-caption text-bold">COMMAND LINE</div>
      <q-btn flat round dense icon="close" size="sm" @click="$emit('close')" />
    </div>

    <div
      ref="outputContainer"
      class="col term-output q-pa-sm bg-grey-9 text-green-4 shadow-inset"
    >
      <div v-for="(line, i) in history" :key="i" class="term-line">
        <span v-if="line.type === 'input'" class="text-white">> {{ line.text }}</span>
        <span v-else>{{ line.text }}</span>
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

    <div class="text-caption text-grey-6 q-mt-xs">
      Skús napísať: <span class="text-bold">/help</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'

const emit = defineEmits(['close'])

interface LogLine {
  type: 'input' | 'output';
  text: string;
}

const cmdInput = ref('')
const history = ref<LogLine[]>([
  { type: 'output', text: 'Vitaj v CMD rozhraní.' },
  { type: 'output', text: 'Napíš /help pre zoznam príkazov.' }
])

const outputContainer = ref<HTMLElement | null>(null)

const scrollToBottom = async () => {
  await nextTick()
  if (outputContainer.value) {
    outputContainer.value.scrollTop = outputContainer.value.scrollHeight
  }
}

const executeCommand = () => {
  const raw = cmdInput.value.trim()
  if (!raw) return

  // Pridaj vstup do histórie
  history.value.push({ type: 'input', text: raw })
  cmdInput.value = ''

  // Logika príkazov
  processCommand(raw)

  // OPRAVA 1: Použitie 'void' na explicitné ignorovanie promise (ESLint fix)
  void scrollToBottom()
}

const processCommand = (cmd: string) => {
  const parts = cmd.split(' ')

  // OPRAVA 2: Ošetrenie undefined pomocou (parts[0] || '')
  const command = (parts[0] || '').toLowerCase()

  switch (command) {
    case '/help':
      history.value.push({ type: 'output', text: 'Dostupné príkazy:' })
      history.value.push({ type: 'output', text: '/join [meno] - vytvorí kanál' })
      history.value.push({ type: 'output', text: '/clear - vymaže obrazovku' })
      history.value.push({ type: 'output', text: '/exit - zatvorí CMD' })
      break

    case '/clear':
      history.value = []
      break

    case '/exit':
      emit('close')
      break

    default:
      history.value.push({ type: 'output', text: `Neznámy príkaz: ${command}` })
  }
}

onMounted(() => {
  // OPRAVA 3: Použitie 'void' aj tu (ESLint fix)
  void scrollToBottom()
})
</script>

<style scoped>
.term-output {
  border-radius: 8px;
  font-family: monospace;
  font-size: 13px;
  overflow-y: auto;
  /* Skrytie scrollbaru, ale funkčnosť ostane */
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
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
}
</style>
