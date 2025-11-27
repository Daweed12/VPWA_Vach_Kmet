import { ref, computed } from 'vue'
import { api } from 'boot/api'

export interface ChannelFromApi {
  id: number
  title: string
  availability: string
  creatorId?: number
  createdAt?: string
  lastMessageAt?: string | null
  logo?: string | null
}

export interface CurrentUser {
  id: number
  email: string
  nickname: string
  firstname: string | null
  surname: string | null
  status: string | null
  profilePicture: string | null
}

export function useChannels(currentUser: { value: CurrentUser | null }) {
  const channels = ref<ChannelFromApi[]>([])
  const channelSearch = ref('')
  const currentChannel = ref<ChannelFromApi | null>(null)
  const currentChannelTitle = ref<string | null>(null)

  const filteredChannels = computed(() => {
    const term = channelSearch.value.trim().toLowerCase()
    if (!term) return channels.value
    return channels.value.filter((c) => c.title.toLowerCase().includes(term))
  })

  const canDeleteCurrentChannel = computed(() => {
    if (!currentUser.value || !currentChannel.value) return false
    return currentChannel.value.creatorId === currentUser.value.id
  })

  const loadChannels = async () => {
    const userId = currentUser.value?.id
    if (!userId) return

    try {
      const chRes = await api.get('/channels', { params: { userId } })
      channels.value = chRes.data
    } catch (error) {
      console.error('Error loading channels:', error)
    }
  }

  const handleChannelClick = (ch: ChannelFromApi) => {
    currentChannelTitle.value = ch.title
    currentChannel.value = ch
    window.dispatchEvent(new CustomEvent('channelSelected', { 
      detail: { id: ch.id, title: ch.title } 
    }))
  }

  return {
    channels,
    channelSearch,
    currentChannel,
    currentChannelTitle,
    filteredChannels,
    canDeleteCurrentChannel,
    loadChannels,
    handleChannelClick
  }
}

