<template>
  <EbikeV2PageShell :row-modules="ROW_MODULES" :side-modules="SIDE_MODULES">
    <template #main>
      <EbikeV2ListPanel
        title="消防档案"
        :columns="COLUMNS"
        :filters="FILTERS"
        search-placeholder="搜索档案名称 / 编号"
        empty-text="暂无消防档案数据"
      />
    </template>
  </EbikeV2PageShell>
</template>

<script setup lang="ts">
/**
 * 消防档案页
 *
 * 台账与留档的检索入口：主区按维度检索档案，
 * 底部看设备档案 / 维保记录 / 证照资质的存量，右列看分类、最近归档与完备率。
 * 本轮只出模块框架与标题。
 */
import EbikeV2ListPanel from '../EbikeV2ListPanel.vue'
import EbikeV2PageShell from './EbikeV2PageShell.vue'

/** 筛选维度 */
const FILTERS = ['档案类型', '所属楼栋', '归档时间', '档案状态']

/** 档案列表表头 */
const COLUMNS = [
  { label: '档案编号', flex: 1.2 },
  { label: '档案名称', flex: 1.6 },
  { label: '所属楼栋', flex: 1 },
  { label: '档案类型', flex: 1 },
  { label: '归档日期', flex: 1 },
  { label: '保管人', flex: 0.8 },
]

/** 底部三模块 */
const ROW_MODULES = ['设备档案统计', '维保记录统计', '证照资质统计']

/** 右列三模块 */
const SIDE_MODULES = ['档案分类', '最近归档', '档案完备率']
</script>
