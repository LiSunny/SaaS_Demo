import { ref, watch, type Ref } from 'vue'

export function useCountUp(target: Ref<number> | number, duration = 1800): Ref<number> {
  const val = ref(0)
  let animating = false
  const targetVal = typeof target === 'number' ? target : target.value

  function animate(t: number) {
    if (animating) return
    animating = true
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      val.value = Math.floor((1 - Math.pow(1 - p, 3)) * t)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  if (typeof target === 'number') {
    // Static target - immediate animate
    animate(targetVal)
  } else {
    // Reactive target
    watch(target, (v) => {
      animate(v)
    }, { immediate: true })
  }

  return val
}
