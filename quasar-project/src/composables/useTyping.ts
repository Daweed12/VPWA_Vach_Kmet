import { ref } from 'vue'

export interface TypingUser {
  id: number
  name: string
  avatar?: string
  draftContent?: string
}

const defaultUserAvatar = new URL('../assets/default_user_avatar.png', import.meta.url).href

export function useTyping() {
  const typingUsers = ref<TypingUser[]>([])
  const typingTimeouts = new Map<number, ReturnType<typeof setTimeout>>()

  const handleTypingUpdate = (data: { userId: number; userName: string; userAvatar?: string; draftContent?: string }, currentUserId?: number | null) => {
    if (!data.userId || !data.userName) return
    if (data.userId === currentUserId) return // Don't show yourself typing

    // Clear existing timeout for this user
    const existingTimeout = typingTimeouts.get(data.userId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Add or update typing user with draft content
    const existingUser = typingUsers.value.find(u => u.id === data.userId)

    if (!existingUser) {
      typingUsers.value.push({
        id: data.userId,
        name: data.userName,
        avatar: data.userAvatar || defaultUserAvatar,
        draftContent: data.draftContent || ''
      })
    } else {
      existingUser.draftContent = data.draftContent || ''
    }
    
    // Set timeout to remove typing indicator after 3 seconds
    const timeout = setTimeout(() => {
      typingUsers.value = typingUsers.value.filter(u => u.id !== data.userId)
      typingTimeouts.delete(data.userId)
    }, 3000)

    typingTimeouts.set(data.userId, timeout)
  }

  const handleTypingStop = (data: { userId: number }) => {
    if (!data.userId) return

    // Clear timeout
    const timeout = typingTimeouts.get(data.userId)
    if (timeout) {
      clearTimeout(timeout)
      typingTimeouts.delete(data.userId)
    }

    // Remove from typing users
    typingUsers.value = typingUsers.value.filter(u => u.id !== data.userId)
  }

  const clearTyping = () => {
    typingUsers.value = []
    typingTimeouts.forEach(timeout => clearTimeout(timeout))
    typingTimeouts.clear()
  }

  return {
    typingUsers,
    handleTypingUpdate,
    handleTypingStop,
    clearTyping
  }
}

