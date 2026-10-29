/**
 * 校园三维模型在大屏背景层的视觉方案调参工具。
 *
 * 直接加载 /campus-model/index.html?embed=1，在独立页面里套用候选参数并截图，
 * 免去改 Vue 组件 → 热更新 → 截图的往返。
 * 生效参数与 src/views/bigscreen/components/ebike-v2/campusTheme.ts 保持一致，
 * 改这里定稿后同步改那边。
 *
 * 用法: node scripts/exp-campus-look.mjs
 */
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = process.env.E2E_BASE ?? 'http://localhost:3200'
const OUT = process.env.EXP_OUT ?? 'screenshots/exp-campus'
mkdirSync(OUT, { recursive: true })

/** 候选方案：在此追加对比项即可（与 campusTheme.ts 的大屏三套配色对应） */
const VARIANTS = [
  {
    label: 'big-day',
    time: 'day',
    camera: { azimuth: 0, elevation: 44, distance: 1120, targetY: 40 },
    theme: {
      skyTop: '#2f86d6',
      skyBottom: '#8ec9ef',
      fogColor: '#7fb8e2',
      fogDensity: 5.4e-4,
      sunColor: '#fff6e6',
      sunIntensity: 2.4,
      hemiSky: '#bcd9f5',
      hemiGround: '#5f6b58',
      hemiIntensity: 0.9,
      ambientColor: '#9fb4c9',
      ambientIntensity: 0.35,
      exposure: 1.05,
    },
    nightGlow: 0,
  },
  {
    label: 'big-night',
    time: 'night',
    camera: { azimuth: 0, elevation: 44, distance: 1120, targetY: 40 },
    theme: {
      skyTop: '#021c38',
      skyBottom: '#023a6b',
      fogColor: '#023a6b',
      fogDensity: 8.0e-4,
      sunColor: '#b9cdf5',
      sunIntensity: 1.15,
      hemiSky: '#3f74ad',
      hemiGround: '#0d1a28',
      hemiIntensity: 0.78,
      ambientColor: '#26527f',
      ambientIntensity: 0.5,
      exposure: 1.5,
    },
    nightGlow: 1,
  },
  {
    label: 'big-dusk',
    time: 'dusk',
    camera: { azimuth: 0, elevation: 44, distance: 1120, targetY: 40 },
    theme: {
      skyTop: '#05284f',
      skyBottom: '#00437a',
      fogColor: '#00437a',
      fogDensity: 7.4e-4,
      sunColor: '#ffd9a8',
      sunIntensity: 1.6,
      hemiSky: '#4d86c4',
      hemiGround: '#0f2438',
      hemiIntensity: 0.75,
      ambientColor: '#24507f',
      ambientIntensity: 0.5,
      exposure: 1.35,
    },
    nightGlow: 1,
  },
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
page.on('pageerror', (e) => console.error('PAGEERROR', e.message))

await page.goto(`${BASE}/campus-model/index.html?embed=1`, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => !!window.campusApp, null, { timeout: 60000 })
await page.waitForTimeout(2500)

for (const v of VARIANTS) {
  await page.evaluate((variant) => {
    const app = window.campusApp
    const THREE = app.ctx.THREE
    app.setQuality('medium')
    app.setTimePreset(variant.time, true)

    const { azimuth, elevation, distance, targetY } = variant.camera
    const rad = (deg) => (deg * Math.PI) / 180
    const horiz = distance * Math.cos(rad(elevation))
    const target = new THREE.Vector3(0, targetY, 0)
    app.controls.target.copy(target)
    app.camera.position.set(
      target.x + horiz * Math.sin(rad(azimuth)),
      target.y + distance * Math.sin(rad(elevation)),
      target.z - horiz * Math.cos(rad(azimuth)),
    )
    app.camera.lookAt(target)
    app.controls.enablePan = false
    app.controls.update()

    const th = variant.theme
    app.scene.traverse((o) => {
      const u = o.material?.uniforms
      if (o.isMesh && o.renderOrder === -1000 && u?.topColor && u?.bottomColor) {
        u.topColor.value.set(th.skyTop)
        u.bottomColor.value.set(th.skyBottom)
      }
      if (o.isDirectionalLight) {
        o.color.set(th.sunColor)
        o.intensity = th.sunIntensity
      } else if (o.isHemisphereLight) {
        o.color.set(th.hemiSky)
        o.groundColor.set(th.hemiGround)
        o.intensity = th.hemiIntensity
      } else if (o.isAmbientLight) {
        o.color.set(th.ambientColor)
        o.intensity = th.ambientIntensity
      }
    })
    app.scene.background = new THREE.Color(th.skyBottom)
    if (app.scene.fog) {
      app.scene.fog.color = new THREE.Color(th.fogColor)
      app.scene.fog.density = th.fogDensity
    }
    app.renderer.toneMappingExposure = th.exposure

    // 夜间灯光浓度：路灯点光 + 窗户自发光
    const pointLights = []
    app.scene.traverse((o) => {
      if (o.isPointLight && o.userData?.baseIntensity) pointLights.push(o)
    })
    if (pointLights.length) {
      const current = pointLights[0].intensity / pointLights[0].userData.baseIntensity
      const ratio = current > 0 ? variant.nightGlow / current : variant.nightGlow
      pointLights.forEach((l) => {
        l.visible = variant.nightGlow > 0.02
        l.intensity = l.userData.baseIntensity * variant.nightGlow
      })
      const seen = new Set()
      app.scene.traverse((o) => {
        const list = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
        list.forEach((m) => {
          if (!m || !('emissive' in m) || seen.has(m.uuid)) return
          seen.add(m.uuid)
          if (m.emissiveIntensity > 0) m.emissiveIntensity *= ratio
        })
      })
    }
  }, v)
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${OUT}/${v.label}.png` })
  const info = await page.evaluate(() => {
    const app = window.campusApp
    return {
      calls: app.renderer.info.render.calls,
      tris: app.renderer.info.render.triangles,
      cam: app.camera.position.toArray().map((n) => Math.round(n)),
    }
  })
  console.log(v.label, JSON.stringify(info))
}

await browser.close()
console.log('输出目录:', OUT)
