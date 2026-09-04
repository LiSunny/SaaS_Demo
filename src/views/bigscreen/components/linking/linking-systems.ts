/**
 * linking-systems.ts — 应消联勤大屏三列系统数据配置
 *
 * 数据驱动：设计稿文案有占位（待替换），后续只需改此文件。
 * 图标 inset 值来自 Figma（88×88 容器内 PNG 的显示位置）。
 */
import icon1 from '@/assets/bigscreen/linking/linking-icon-1.png'
import icon2 from '@/assets/bigscreen/linking/linking-icon-2.png'
import icon3 from '@/assets/bigscreen/linking/linking-icon-3.png'
import icon4 from '@/assets/bigscreen/linking/linking-icon-4.png'
import icon5 from '@/assets/bigscreen/linking/linking-icon-5.png'
import icon6 from '@/assets/bigscreen/linking/linking-icon-6.png'
import icon7 from '@/assets/bigscreen/linking/linking-icon-7.png'
import icon8 from '@/assets/bigscreen/linking/linking-icon-8.png'
import icon9 from '@/assets/bigscreen/linking/linking-icon-9.png'
import iconSys from '@/assets/bigscreen/linking/linking-icon-sys.png'

/** 系统卡片 */
export interface SysCardItem {
  /** 系统名称 */
  title: string
  /** 副标题（⚠️ 占位文案，待产品提供后替换） */
  subtitle: string
  /** 图标 */
  icon: string
  /** 图标在 88×88 容器内的 inset（Figma 值，CSS inset 顺序：top right bottom left） */
  iconInset: string
  /** 子模块 id（对应应消联勤平台 index.html 的 MODULES[id]，点击卡片跳转）；规划中卡片无此字段 */
  mod?: number
  /** 规划中（未实现）：置灰不可点（事后·复盘列，2026-09-04） */
  planned?: boolean
}

/** 列配置 */
export interface SysColumnData {
  /** 中文列标题 */
  title: string
  /** 英文列标题 */
  enTitle: string
  /** 英文标题绝对定位 left（Figma px，相对列内容区 475.667px 宽） */
  enLeft: number
  /** 列副标题 */
  desc: string
  /** 系统卡片列表 */
  cards: SysCardItem[]
  /** 规划中（未实现）：列头打「规划中」标识，卡片全部置灰不可点（事后·复盘列） */
  planned?: boolean
}

/** 三列数据（左：事前·预防 / 中：事中·响应 / 右：事后·复盘）
 *  卡片副标题统一取 data/modules.ts 各模块的 tag（模块内容官方定位，2026-09-04 替换占位文案） */
export const SYS_COLUMNS: SysColumnData[] = [
  {
    title: '事前·预防',
    enTitle: 'Prevention',
    enLeft: 364.33,
    desc: '压实责任 · 摸清底数 · 防控前置',
    cards: [
      { title: '商铺主体责任系统', subtitle: '责任显性化 · 主动履责', icon: icon1, iconInset: '13.64% 13.64% 15.15% 12.12%', mod: 1 },
      { title: '设备运行监测系统', subtitle: '在线态势 · 全生命周期', icon: icon2, iconInset: '11.36% 13.64% 12.88% 12.12%', mod: 3 },
      { title: '商铺数字档案系统', subtitle: '一店一码 · 动态更新', icon: icon3, iconInset: '9.85% 13.64% 11.36% 12.12%', mod: 4 },
      { title: '设备生命周期系统', subtitle: '按店归集 · 一机一档', icon: icon4, iconInset: '16.67% 13.64% 18.18% 12.12%', mod: 5 },
      { title: '动火作业全流程管控', subtitle: '四维防控 · 全流程闭环', icon: icon5, iconInset: '13.64% 13.64% 15.15% 12.12%', mod: 9 },
    ],
  },
  {
    title: '事中·响应',
    enTitle: 'Response',
    enLeft: 376.67,
    desc: '智能感知 · 联动处置 · 闭环留痕',
    cards: [
      { title: '智能感知告警系统', subtitle: '设备事件 · 隐患排查', icon: icon6, iconInset: '16.67% 13.64% 18.18% 12.12%', mod: 2 },
      { title: '隐患排查治理系统', subtitle: '按商户维度 · 处理进度跟踪', icon: icon7, iconInset: '13.64% 13.64% 15.15% 12.12%', mod: 6 },
      { title: '联勤协同联动系统', subtitle: '公告下达 · 阅读留痕 · 反馈收集', icon: icon8, iconInset: '15.91% 13.64% 17.42% 12.12%', mod: 7 },
      { title: '消控联网监控系统', subtitle: '联网监控 · 远程可视', icon: iconSys, iconInset: '16.67% 13.64% 16.67% 12.12%', mod: 8 },
      { title: '应急预案联动系统', subtitle: '预案调度 · 多方联动', icon: icon9, iconInset: '13.64% 13.64% 15.15% 12.12%', mod: 10 },
    ],
  },
  {
    title: '事后·复盘',
    enTitle: 'Review',
    enLeft: 404.67,
    desc: '数据驱动 · 持续改进',
    /* 规划但尚未实现（2026-09-04 拍板）：整列置灰不可点，卡片罗列规划功能；
       实现后恢复 mod 跳转并去掉 planned 标记 */
    planned: true,
    cards: [
      { title: '复盘分析报告', subtitle: '告警处置全流程回溯 · 时间线复盘', icon: icon6, iconInset: '16.67% 13.64% 18.18% 12.12%', planned: true },
      { title: '履责考核统计', subtitle: '商户 · 网格 · 街道履职排名', icon: icon7, iconInset: '13.64% 13.64% 15.15% 12.12%', planned: true },
      { title: '安全信用画像', subtitle: '失责记录沉淀 · 商户信用分级', icon: icon8, iconInset: '15.91% 13.64% 17.42% 12.12%', planned: true },
      { title: '隐患趋势分析', subtitle: '高发类型 · 区域分布趋势', icon: iconSys, iconInset: '16.67% 13.64% 16.67% 12.12%', planned: true },
      { title: '监管报告输出', subtitle: '周期性安全监管报告 · 自动生成', icon: icon9, iconInset: '13.64% 13.64% 15.15% 12.12%', planned: true },
    ],
  },
]
