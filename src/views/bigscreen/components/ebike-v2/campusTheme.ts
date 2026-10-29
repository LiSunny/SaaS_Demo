/**
 * 校园三维模型在大屏背景层的视觉方案。
 *
 * 数值由 scripts/exp-campus-look.mjs 实测对比得出（big-day / big-night / big-dusk）。
 * - 机位：正南方向俯视 44°，距离 1120 m —— 校园地块与屏幕中轴对齐，
 *   地块边界落在画面左右两侧，深色天空收在上方。
 * - 配色：天空 / 雾统一收敛到大屏蓝色系，雾色 = 天穹底部色，
 *   地块远端被雾吃掉，消除"悬浮在虚空里"的硬边。
 * - 灯光：暖色主光 + 蓝天光，保证建筑在深蓝底色上依然可读；
 *   夜间靠路灯与窗户自发光提供亮点。
 */

export type CampusTimePreset = 'day' | 'dusk' | 'night'

export interface CampusTheme {
  /** 天穹顶部色 */
  skyTop: string
  /** 天穹底部色（同时作为场景背景色） */
  skyBottom: string
  /** 雾色：与天穹底部同色，远端地块自然融进背景 */
  fogColor: string
  /** 雾密度（FogExp2，每世界单位） */
  fogDensity: number
  /** 主光颜色 */
  sunColor: string
  /** 主光强度 */
  sunIntensity: number
  /** 半球光天空色 */
  hemiSky: string
  /** 半球光地面色 */
  hemiGround: string
  /** 半球光强度 */
  hemiIntensity: number
  /** 环境光颜色 */
  ambientColor: string
  /** 环境光强度 */
  ambientIntensity: number
  /** 色调映射曝光 */
  exposure: number
  /** 夜间灯光浓度：路灯 + 窗户自发光（0~1） */
  nightGlow: number
}

export interface CampusCamera {
  /** 方位角（度）：0 = 正南 */
  azimuth: number
  /** 俯角（度） */
  elevation: number
  /** 相机到目标点的距离（米） */
  distance: number
  /** 目标点高度（米） */
  targetY: number
}

/** 白天：亮蓝天空 + 明亮地块 */
const DAY_THEME: CampusTheme = {
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
  nightGlow: 0,
}

/** 黄昏：暖色主光 + 蓝天光 + 路灯暖点（默认） */
const DUSK_THEME: CampusTheme = {
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
  nightGlow: 1,
}

/** 夜晚：深蓝夜空 + 月光 + 路灯 / 窗户全亮 */
const NIGHT_THEME: CampusTheme = {
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
  nightGlow: 1,
}

/** 昼夜三档各自的大屏配色 */
export const BIGSCREEN_CAMPUS_THEMES: Record<CampusTimePreset, CampusTheme> = {
  day: DAY_THEME,
  dusk: DUSK_THEME,
  night: NIGHT_THEME,
}

/** 默认预设（进入大屏时的场景） */
export const BIGSCREEN_CAMPUS_DEFAULT_TIME: CampusTimePreset = 'dusk'

export const BIGSCREEN_CAMPUS_CAMERA: CampusCamera = {
  azimuth: 0,
  elevation: 44,
  distance: 1120,
  targetY: 40,
}
