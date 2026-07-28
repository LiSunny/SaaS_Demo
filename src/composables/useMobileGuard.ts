import { ref } from 'vue'

export function useMobileGuard(loginUrl?: string) {
  const showMobileTip = ref(false)
  const copied = ref(false)

  const isMobile = () => window.innerWidth < 768

  function goExp() {
    if (isMobile()) {
      showMobileTip.value = true
    } else {
      const url = loginUrl || '/login'
      window.location.href = url
    }
  }

  async function copyExpUrl() {
    const url = window.location.origin + (loginUrl || '/login')
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }

  return { showMobileTip, copied, goExp, copyExpUrl }
}
