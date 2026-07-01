import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export function useInView(threshold = 0.15, once = true): { el: Ref<HTMLElement | null>; inView: Ref<boolean> } {
  const el = ref<HTMLElement | null>(null)
  const inView = ref(false)
  let obs: IntersectionObserver | null = null

  onMounted(() => {
    if (!el.value) return
    obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          inView.value = true
          if (once) obs?.disconnect()
        }
      },
      { threshold }
    )
    obs.observe(el.value)
  })

  onUnmounted(() => obs?.disconnect())

  return { el, inView }
}
