/**
 * module-registry.ts — 占位页配置汇总
 *
 * 各模块在自己的目录内维护页面配置，本文件汇总为一张「路由名 → 配置」表，
 * 供 `src/views/shared/ModulePlaceholder.vue` 按 route.name 读取。
 *
 * 新增模块时：写一份 `<module>-pages.ts`，在此处合并即可，无需改动占位组件。
 */
import type { ModulePageConfig } from './module-page-config'
import { OVERVIEW_PAGES } from '@/views/overview/overview-pages'
import { DUTY_PAGES } from '@/views/duty/duty-pages'
import { TRAINING_PAGES } from '@/views/training/training-pages'
import { MAINTENANCE_PAGES } from '@/views/fire-maintenance/fire-maintenance-pages'
import { SPECIAL_WORK_PAGES } from '@/views/special-work/special-work-pages'
import { ARCHIVE_PAGES } from '@/views/safety-archive/safety-archive-pages'
import { PROJECT_PAGES } from '@/views/project/project-pages'

export const MODULE_PAGE_CONFIG: Record<string, ModulePageConfig> = {
  ...OVERVIEW_PAGES,
  ...DUTY_PAGES,
  ...TRAINING_PAGES,
  ...MAINTENANCE_PAGES,
  ...SPECIAL_WORK_PAGES,
  ...ARCHIVE_PAGES,
  ...PROJECT_PAGES,
}
