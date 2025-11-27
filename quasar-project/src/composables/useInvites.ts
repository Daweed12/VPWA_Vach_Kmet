import { ref } from 'vue'
import { api } from 'boot/api'

export interface InviteFromApi {
  id: number
  channelId: number
  title: string
  availability: string
  inviterId: number
  createdAt: string
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

export function useInvites(currentUser: { value: CurrentUser | null }) {
  const invites = ref<InviteFromApi[]>([])

  const loadInvites = async () => {
    const userId = currentUser.value?.id
    if (!userId) return

    try {
      const invRes = await api.get('/invites', { params: { userId } })
      invites.value = invRes.data
    } catch (error) {
      console.error('Error loading invites:', error)
    }
  }

  const handleAccept = async (inv: InviteFromApi) => {
    try {
      await api.post(`/invites/${inv.id}/accept`)
      invites.value = invites.value.filter((i) => i.id !== inv.id)
      return true
    } catch (error) {
      console.error('Error accepting invite:', error)
      return false
    }
  }

  const handleReject = async (inv: InviteFromApi) => {
    try {
      await api.post(`/invites/${inv.id}/reject`)
      invites.value = invites.value.filter((i) => i.id !== inv.id)
    } catch (error) {
      console.error('Error rejecting invite:', error)
    }
  }

  return {
    invites,
    loadInvites,
    handleAccept,
    handleReject
  }
}

