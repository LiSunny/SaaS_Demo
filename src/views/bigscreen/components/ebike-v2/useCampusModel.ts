/**
 * 三维模型实例的跨组件传递。
 *
 * 模型组件在页面层（EbikeMonitorV2），而「建筑导航开关」「昼夜切换」在顶栏层
 * （EbikeV2Header），层级不同且不是父子关系，用 provide / inject 直连，
 * 避免把模型实例一路透传。
 */
import { inject, provide, type InjectionKey, type Ref } from 'vue'

/** EbikeV2CampusModel 通过 defineExpose 暴露的接口 */
export interface CampusModelApi {
  model: any
  readonly timePreset: 'day' | 'dusk' | 'night'
  setTimePreset(name: 'day' | 'dusk' | 'night'): void
  setQuality(name: 'high' | 'medium' | 'low'): void
  resetView(): void
  applyTheme(): void
  selectPOI(poi: any, options?: { fly?: boolean }): void
  togglePoiPanel(force?: boolean): boolean
}

export const CAMPUS_MODEL_KEY: InjectionKey<Ref<CampusModelApi | null>> = Symbol('campusModel')

export function provideCampusModel(ref: Ref<CampusModelApi | null>) {
  provide(CAMPUS_MODEL_KEY, ref)
}

export function useCampusModel() {
  return inject(CAMPUS_MODEL_KEY, null)
}
