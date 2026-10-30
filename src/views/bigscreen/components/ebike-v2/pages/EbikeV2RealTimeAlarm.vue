<template>
  <EbikeV2PageShell :row-modules="ROW_MODULES" :side-modules="SIDE_MODULES">
    <template #main>
      <EbikeV2ListPanel
        title="实时警情"
        :columns="COLUMNS"
        :filters="FILTERS"
        search-placeholder="搜索警情内容 / 位置"
        empty-text="暂无实时警情数据"
      />
    </template>
  </EbikeV2PageShell>
</template>

<script setup lang="ts">
/**
 * 实时警情页
 *
 * 值班中心的"现在有什么要处理"：主区看警情流水与处置状态，
 * 底部看分布与时效，右列看当日总量、待处置与处置动态。
 * 本轮只出模块框架与标题。
 */
import EbikeV2ListPanel from '../EbikeV2ListPanel.vue'
import EbikeV2PageShell from './EbikeV2PageShell.vue'

/** 筛选维度 */
const FILTERS = ['警情类型', '所属楼栋', '时间范围', '警情级别']

/** 警情列表表头 */
const COLUMNS = [
  { label: '警情时间', flex: 1.1 },
  { label: '警情位置', flex: 1.3 },
  { label: '警情类型', flex: 1 },
  { label: '警情级别', flex: 0.8 },
  { label: '处置状态', flex: 0.9 },
  { label: '处置人', flex: 0.8 },
]

/** 底部三模块 */
const ROW_MODULES = ['警情类型分布', '处置时效分析', '值班力量分布']

/** 右列三模块 */
const SIDE_MODULES = ['今日警情统计', '待处置警情', '处置动态']
</script>
