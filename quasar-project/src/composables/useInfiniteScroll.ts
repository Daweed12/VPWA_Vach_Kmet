import { ref, computed, nextTick } from 'vue'

export function useInfiniteScroll(totalItems: { value: number }) {
  const step = 15
  const visibleCount = ref(0)
  const isLoading = ref(false)
  const finished = ref(false)
  const infiniteKey = ref(0)

  // This computed is not used in the current implementation, but kept for potential future use
  const visibleItems = computed(() => {
    const total = totalItems.value
    if (total === 0) return []
    return Array.from({ length: total }, (_, i) => i)
  })

  const resetPaging = () => {
    visibleCount.value = 0
    isLoading.value = false
    finished.value = false
    infiniteKey.value++
  }

  const onLoad = (index: number, done: (finished?: boolean) => void, scrollArea?: HTMLElement | null) => {
    if (isLoading.value) {
      done()
      return
    }
    if (finished.value) {
      done(true)
      return
    }

    isLoading.value = true

    const el = scrollArea
    const prevScrollHeight = el?.scrollHeight ?? 0

    setTimeout(() => {
      const total = totalItems.value
      const next = Math.min(visibleCount.value + step, total)
      visibleCount.value = next

      void nextTick(() => {
        const newScrollHeight = el?.scrollHeight ?? 0
        if (el) {
          el.scrollTop += newScrollHeight - prevScrollHeight
        }

        isLoading.value = false

        if (visibleCount.value >= total) {
          finished.value = true
          done(true)
        } else {
          done()
        }
      })
    }, 300)
  }

  const initializeVisibleCount = (initialCount?: number) => {
    const total = totalItems.value
    visibleCount.value = Math.min(initialCount || step, total)
    finished.value = visibleCount.value >= total
  }

  return {
    step,
    visibleCount,
    isLoading,
    finished,
    infiniteKey,
    visibleItems,
    resetPaging,
    onLoad,
    initializeVisibleCount
  }
}

