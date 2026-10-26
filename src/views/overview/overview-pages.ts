/**
 * overview-pages.ts — 安全概览模块占位页配置
 *
 * 「安全管理」一级菜单解散后，其「安全概览」升为独立一级菜单（key: unit-overview）。
 * 可视化大屏复用真实页 /enterprise-cockpit，不进本表。
 */
import type { ModulePageConfig } from '@/views/shared/module-page-config'

export const OVERVIEW_PAGES: Record<string, ModulePageConfig> = {
  OverviewSituation: {
    code: 'S-1',
    title: '安全态势',
    module: '安全概览',
    desc: '本单位安全状况一屏总览：告警、隐患、巡查、值守四条主线当前状态与异常清单。',
    caps: [
      '告警态势：今日新增告警数、未处置数、超时未处置数',
      '隐患态势：整改中 / 已闭环 / 逾期未整改分布',
      '巡查态势：应巡点数、已完成率、漏巡点位',
      '值守态势：在岗状态、当班人员、未处置主机信号',
      '异常清单：按严重度排序，定位到具体处置入口',
    ],
    status: '页面占位中 · 功能概述',
    statusTone: 'info',
  },

  OverviewData: {
    code: 'S-2',
    title: '数据看板',
    module: '安全概览',
    desc: '安全指标的趋势与对比视图：按周期、按管理单元、按责任人查看安全指标走势。',
    caps: [
      '指标卡：隐患闭环率、整改逾期率、巡查完成率、告警处置及时率',
      '趋势图：按日 / 周 / 月查看指标变化',
      '对比维度：管理单元、岗位、部门、责任人',
      '同比环比：本期与上期对比，标注劣化项',
      '导出：指标明细导出 PDF / Excel',
    ],
    status: '页面占位中 · 功能概述',
    statusTone: 'info',
  },
}
