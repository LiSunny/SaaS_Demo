<template>
  <div class="detail-page">
    <div class="content-card" v-loading="store.detailLoading">
      <!-- ===== 顶部操作栏 ===== -->
      <div class="action-bar">
        <div class="action-bar-left">
          <button class="btn-link" @click="handleBack">
            <AppIcon name="arrow-left" class="btn-link-icon" />
            返回租户列表
          </button>
        </div>
        <div class="action-bar-right">
          <button class="btn-outline-primary" @click="handleEdit">
            <AppIcon name="edit" class="btn-icon" />
            编辑
          </button>
          <button class="btn-outline-danger" @click="handleDelete">
            <AppIcon name="delete" class="btn-icon" />
            删除
          </button>
        </div>
      </div>

      <template v-if="store.detail">
        <!-- ===== 企业头部信息卡片 ===== -->
        <div class="header-card">
          <div class="header-card-body">
            <!-- 左侧：Logo + 基本信息 + 统计 -->
            <div class="header-left">
              <div class="company-logo">
                <img
                  v-if="store.detail.logo"
                  :src="store.detail.logo"
                  alt="logo"
                  class="logo-img"
                />
                <div v-else class="logo-placeholder">
                  <img :src="entLogoPng" alt="logo" class="logo-placeholder-icon" />
                </div>
              </div>

              <div class="company-info">
                <div class="company-name-row">
                  <h2 class="company-name">{{ store.detail.name }}</h2>
                  <span v-if="dimDLabel" class="company-tag">{{ dimDLabel }}</span>
                </div>
                <div class="company-meta">
                  <span class="meta-line">添加日期：{{ store.detail.createdAt || '--' }}</span>
                  <span class="meta-line">详细地址：{{ store.detail.address || '--' }}</span>
                </div>
              </div>

              <div class="stat-divider"></div>

              <div class="company-stats">
                <div class="stat-item">
                  <div class="stat-icon-bg">
                    <img :src="personSvg" class="stat-icon" />
                  </div>
                  <div class="stat-text">
                    <span class="stat-label">人员总数</span>
                    <span class="stat-number">{{ store.detail.staffCount ?? 0 }} <small>人</small></span>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon-bg">
                    <img :src="unitSvg" class="stat-icon" />
                  </div>
                  <div class="stat-text">
                    <span class="stat-label">管理单元数</span>
                    <span class="stat-number">{{ store.detail.unitCount ?? 0 }} <small>个</small></span>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon-bg">
                    <img :src="connectSvg" class="stat-icon" />
                  </div>
                  <div class="stat-text">
                    <span class="stat-label">关联企业数</span>
                    <span class="stat-number">{{ store.detail.relCount ?? 0 }} <small>个</small></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧：二维码 -->
            <div class="header-right">
              <div class="qrcode-container">
                <img
                  v-if="store.qrcode"
                  :src="store.qrcode"
                  alt="二维码"
                  class="qrcode-img"
                />
                <div v-else class="qrcode-placeholder">
                  <AppIcon name="qrcode" class="qrcode-placeholder-icon" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== Tab 导航 ===== -->
        <div class="tab-bar">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['tab-item', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- ===== Tab 内容：企业详情 ===== -->
        <div v-if="activeTab === 'enterpriseDetail'" class="tab-content">
          <div class="tab-content-inner">
            <!-- 信息网格 -->
            <div class="form-grid">
              <div class="form-field">
                <span class="form-label">消防单位类别</span>
                <span class="form-value">{{ dimBLabel }}</span>
              </div>
              <div class="form-field">
                <span class="form-label">行业分类</span>
                <span class="form-value">{{ store.detail.dimC?.name || '--' }}</span>
              </div>
              <div class="form-field">
                <span class="form-label">场所类型</span>
                <span class="form-value dimd-value">{{ dimDLabel || '----' }}</span>
              </div>

              <div class="form-field">
                <span class="form-label">行政区划</span>
                <span class="form-value">{{ store.detail.region || '--' }}</span>
              </div>
              <div class="form-field">
                <span class="form-label">详细地址</span>
                <span class="form-value">{{ store.detail.address || '--' }}</span>
              </div>
              <div class="form-field">
                <span class="form-label">企业标签</span>
                <span class="form-value">{{ tagsDisplay || '----' }}</span>
              </div>

              <div class="form-field">
                <span class="form-label">上级企业</span>
                <span class="form-value">{{ store.detail.parentName || '----' }}</span>
              </div>
              <div class="form-field">
                <span class="form-label">授权期限</span>
                <span class="form-value">{{ authPeriod }}</span>
              </div>
              <div class="form-field">
                <span class="form-label">备注</span>
                <span class="form-value">{{ store.detail.remark || '----' }}</span>
              </div>
              <div class="form-field">
                <span class="form-label">负责人</span>
                <span class="form-value">{{ contactDisplay }}</span>
              </div>
            </div>

            <!-- 管理员账号（从企业创建时自动初始化） -->
            <div v-if="store.detail.adminAccount" class="section">
              <h3 class="section-title">管理员账号</h3>
              <div class="admin-account-card">
                <div class="admin-account-row">
                  <span class="admin-label">账号</span>
                  <span class="admin-value">{{ store.detail.adminAccount.phone }}</span>
                  <button class="btn-copy" @click="copyText(store.detail.adminAccount.phone)">
                    <el-icon :size="14"><CopyDocument /></el-icon>
                    复制
                  </button>
                </div>
                <div class="admin-account-row">
                  <span class="admin-label">姓名</span>
                  <span class="admin-value">{{ store.detail.adminAccount.name }}</span>
                </div>
                <p class="admin-hint">初始密码为 admin123!@#，首次登录需修改密码。可在用户管理中调整岗位或移交管理员。</p>
              </div>
            </div>

            <!-- GIS 定位 -->
            <div class="section">
              <h3 class="section-title">GIS 定位</h3>
              <div class="map-container">
                <!-- 有坐标：显示真实地图 -->
                <div v-if="hasGisData" ref="detailMapContainer" class="detail-map" />
                <!-- 无坐标：占位 -->
                <div v-else class="map-placeholder">
                  <AppIcon name="map" class="map-placeholder-icon" />
                  <span class="map-placeholder-text">暂无 GIS 定位信息</span>
                </div>
              </div>
              <!-- 地址信息 -->
              <div v-if="hasGisData" class="gis-info-row">
                <div class="gis-info-item">
                  <span class="gis-info-label">地址</span>
                  <span class="gis-info-value" :title="store.detail?.mapAddress">{{ store.detail?.mapAddress || '—' }}</span>
                </div>
                <div class="gis-info-item">
                  <span class="gis-info-label">经纬度</span>
                  <span class="gis-info-value">{{ store.detail?.mapLocation || '—' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== Tab 内容：下级管理 ===== -->
        <div v-else-if="activeTab === 'subordinateMgmt'" class="tab-content">
          <SubordinateManage :enterprise-id="store.detail?.id || ''" />
        </div>

        <!-- ===== Tab 内容：相关方管理 ===== -->
        <div v-else-if="activeTab === 'partnerMgmt'" class="tab-content">
          <PartnerManage :enterprise-id="store.detail?.id || ''" />
        </div>

        <!-- ===== Tab 内容：操作日志 ===== -->
        <div v-else-if="activeTab === 'operationLog'" class="tab-content">
          <OperationLogsTab
            :logs="store.logs"
            :loading="store.logLoading"
            :error="null"
            :page="store.logPage"
            :size="store.logSize"
            :total="store.logTotal"
            @refresh="store.fetchLogs(store.detail!.id)"
            @page-change="(p: number, s: number) => store.fetchLogs(store.detail!.id, p, s)"
          />
        </div>

        <!-- ===== Tab 内容：个性化配置 ===== -->
        <div v-else-if="activeTab === 'branding'" class="tab-content">
          <div class="tab-content-inner">
            <div class="section">
              <h3 class="section-title">品牌信息</h3>
              <div class="branding-form-grid">
                <div class="branding-field">
                  <span class="branding-label">域名</span>
                  <el-input v-model="brandingForm.domain" placeholder="如 tenant.platform.com" />
                </div>
                <div class="branding-field">
                  <span class="branding-label">版权公告</span>
                  <el-input v-model="brandingForm.copyright" placeholder="如 © 2026 Company" />
                </div>
                <div class="branding-field">
                  <span class="branding-label">ICP 备案</span>
                  <el-input v-model="brandingForm.icp" placeholder="如 京ICP备XXXXXXXX号" />
                </div>
                <div class="branding-field">
                  <span class="branding-label">平台标题</span>
                  <el-input v-model="brandingForm.title" placeholder="如 XX安全管理平台" />
                </div>
              </div>
            </div>
            <div class="save-bar">
              <button class="btn-primary" @click="handleSaveBranding">保存</button>
            </div>
          </div>
        </div>

        <!-- ===== Tab 内容：应用配置 ===== -->
        <div v-else-if="activeTab === 'appConfig'" class="tab-content">
          <div class="tab-content-inner">
            <template v-if="moduleTabs.length === 0">
              <div class="empty-hint">暂无模块数据，请稍后再试</div>
            </template>
            <template v-else>
              <el-tabs v-model="appConfigTab">
                <el-tab-pane
                  v-for="tab in moduleTabs"
                  :key="tab.key"
                  :label="tab.label"
                  :name="tab.key"
                  lazy
                >
                  <el-tree
                    v-if="tab.children.length > 0"
                    :ref="(el: any) => { if (el) treeRefs[tab.key] = el }"
                    :data="tab.children"
                    show-checkbox
                    node-key="key"
                    default-expand-all
                    :default-checked-keys="getCheckedKeys(tab.key)"
                  />
                  <div v-else class="empty-hint">该分类暂无功能模块</div>
                </el-tab-pane>
              </el-tabs>
              <div class="save-bar">
                <button class="btn-primary" @click="handleSaveAppConfig">保存</button>
              </div>
            </template>
          </div>
        </div>

        <!-- ===== 其他 Tab 占位 ===== -->
        <div v-else class="tab-stub">
          <div class="stub-content">
            <AppIcon name="time" class="stub-icon" />
            <p class="stub-text">功能开发中</p>
          </div>
        </div>
      </template>
    </div>

    <!-- ===== 编辑租户 Drawer ===== -->
    <EnterpriseFormDrawer
      v-model:visible="drawerVisible"
      :mode="drawerMode"
      :edit-id="drawerEditId"
      @saved="onDrawerSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useConfirm } from '@/composables/useConfirm'
import { CopyDocument } from '@element-plus/icons-vue'
import { useEnterpriseStore } from '@/stores/enterprise'
import type { ModuleTreeNode } from '@/types/enterprise'
import AppIcon from '@/components/base/AppIcon.vue'
import PartnerManage from './PartnerManage.vue'
import SubordinateManage from './SubordinateManage.vue'
import EnterpriseFormDrawer from '@/components/business/EnterpriseFormDrawer.vue'
import OperationLogsTab from '@/components/business/OperationLogsTab.vue'

// ===== Store / Router（必须在最前面，后续 computed/watch 要用） =====
const route = useRoute()
const router = useRouter()
const store = useEnterpriseStore()
const { confirmDeleteWithInput } = useConfirm()

// ===== 编辑抽屉 =====
const drawerVisible = ref(false)
const drawerMode = ref<'create' | 'edit'>('edit')
const drawerEditId = ref('')

function openEditDrawer() {
  if (!store.detail) return
  drawerMode.value = 'edit'
  drawerEditId.value = store.detail.id
  drawerVisible.value = true
}

function onDrawerSaved() {
  drawerVisible.value = false
  if (store.detail?.id) {
    store.fetchDetail(store.detail.id)
    store.fetchQrcode(store.detail.id)
  }
}

// ===== GIS 地图（只读展示） =====
const detailMapContainer = ref<HTMLDivElement>()
let detailMapInstance: any = null

const hasGisData = computed(() => {
  const d = store.detail
  return !!(d && d.mapLocation)
})

// 初始化只读地图（标记企业位置）
function initDetailMap() {
  if (!detailMapContainer.value || !(window as any).AMap) return
  const d = store.detail
  if (!d?.mapLocation) return

  const parts = d.mapLocation.split(',')
  if (parts.length !== 2) return
  const lng = parseFloat(parts[0])
  const lat = parseFloat(parts[1])
  if (isNaN(lng) || isNaN(lat)) return

  const AMap = (window as any).AMap
  detailMapInstance = new AMap.Map(detailMapContainer.value, {
    zoom: 15,
    center: [lng, lat],
    mapStyle: 'amap://styles/light',
    viewMode: '2D',
    resizeEnable: true,
  })

  // 添加标记点
  const marker = new AMap.Marker({
    position: [lng, lat],
    anchor: 'bottom-center',
  })
  detailMapInstance.add(marker)
}

function destroyDetailMap() {
  if (detailMapInstance) {
    detailMapInstance.destroy()
    detailMapInstance = null
  }
}

// 监听详情数据加载完成后初始化地图
watch(() => store.detail, (d) => {
  if (d?.mapLocation) {
    nextTick(() => initDetailMap())
  }
}, { deep: false })

onBeforeUnmount(() => {
  destroyDetailMap()
})

// ===== Tab 状态 =====
const tabs = [
  { key: 'enterpriseDetail', label: '企业详情' },
  { key: 'subordinateMgmt', label: '下级管理' },
  { key: 'partnerMgmt', label: '相关方管理' },
  { key: 'operationLog', label: '操作日志' },
  { key: 'branding', label: '个性化配置' },
  { key: 'appConfig', label: '应用配置' },
] as const
type TabKey = (typeof tabs)[number]['key']
const activeTab = ref<TabKey>('enterpriseDetail')

// 切换到操作日志 Tab 时自动拉取日志
watch(activeTab, (tab) => {
  if (tab === 'operationLog' && store.detail?.id) {
    store.fetchLogs(store.detail.id)
  }
  // 应用配置 Tab：加载模块树字典
  if (tab === 'appConfig' && store.moduleTree.length === 0) {
    store.fetchDicts()
  }
  // 个性化配置 Tab：从企业数据回填表单
  if (tab === 'branding' && store.detail) {
    const d = store.detail as any
    brandingForm.value.domain = d.brandingDomain || ''
    brandingForm.value.copyright = d.brandingCopyright || ''
    brandingForm.value.icp = d.brandingIcp || ''
    brandingForm.value.title = d.brandingTitle || ''
  }
})

// ===== 个性化配置 (Branding) =====
const brandingForm = ref({
  domain: '',
  copyright: '',
  icp: '',
  title: '',
})

async function handleSaveBranding() {
  if (!store.detail?.id) return
  await store.handleUpdate(store.detail.id, {
    brandingDomain: brandingForm.value.domain,
    brandingCopyright: brandingForm.value.copyright,
    brandingIcp: brandingForm.value.icp,
    brandingTitle: brandingForm.value.title,
  } as any)
  // 同步本地 detail 使表单在切换 Tab 后仍能正确回填
  const d = store.detail as any
  d.brandingDomain = brandingForm.value.domain
  d.brandingCopyright = brandingForm.value.copyright
  d.brandingIcp = brandingForm.value.icp
  d.brandingTitle = brandingForm.value.title
}

// ===== 应用配置 (App Config) =====
const appConfigTab = ref('')
const treeRefs = ref<Record<string, any>>({})

// 静态模块树兜底数据（后端 /enterprise/dict/module-tree 未实现时使用）
const FALLBACK_MODULE_TREE: ModuleTreeNode[] = [
  { key: '设备管理', label: '设备管理', children: [
    { key: 'device-ledger', label: '设备台账' }, { key: 'maintenance', label: '保养管理' }, { key: 'monitor', label: '运行监控' },
  ]},
  { key: 'IOT', label: 'IOT', children: [] },
  { key: '远程值守', label: '远程值守', children: [
    { key: 'alarm-center', label: '告警中心' }, { key: 'verify', label: '核实判定' },
  ]},
  { key: '巡查检查', label: '巡查检查', children: [
    { key: 'patrol-plan', label: '巡查计划' }, { key: 'patrol-task', label: '巡查任务' },
  ]},
  { key: '维保应用', label: '维保应用', children: [] },
  { key: '数据可视化', label: '数据可视化', children: [] },
  { key: '平台管理', label: '平台管理', children: [] },
  { key: '隐患管理', label: '隐患管理', children: [
    { key: 'hazard-ledger', label: '隐患台账' },
  ]},
  { key: '项目管理', label: '项目管理', children: [] },
  { key: '政务管理', label: '政务管理', children: [] },
  { key: '培训与演练', label: '培训与演练', children: [] },
  { key: '危险作业管理', label: '危险作业管理', children: [] },
  { key: '食品安全管理', label: '食品安全管理', children: [] },
  { key: '系统管理', label: '系统管理', children: [] },
]

const moduleTabs = computed(() => {
  const source = store.moduleTree.length > 0 ? store.moduleTree : FALLBACK_MODULE_TREE
  return source.map(node => ({
    key: node.key,
    label: node.label,
    children: (node.children || []).filter(c => c.key && c.label),
  }))
})

// 当 moduleTabs 准备好后设置默认激活 Tab
watch(moduleTabs, (tabs) => {
  if (!appConfigTab.value && tabs.length > 0) {
    appConfigTab.value = tabs[0].key
  }
})

function getCheckedKeys(domainKey: string): string[] {
  if (!store.detail) return []
  const appConfig = (store.detail as any).appConfig as Record<string, string[]> | undefined
  if (!appConfig) return []
  return appConfig[domainKey] || []
}

async function handleSaveAppConfig() {
  if (!store.detail?.id) return
  // 合并已有配置：未访问过的 tab 保留原配置
  const existing = ((store.detail as any).appConfig || {}) as Record<string, string[]>
  const appConfig: Record<string, string[]> = { ...existing }
  for (const tab of moduleTabs.value) {
    const tree = treeRefs.value[tab.key]
    if (tree) {
      const checkedKeys = tree.getCheckedKeys(true) as string[]
      appConfig[tab.key] = checkedKeys
    }
  }
  await store.handleUpdate(store.detail.id, { appConfig })
  // 同步本地 detail 使树选中状态在切换 Tab 后保持不变
  ;(store.detail as any).appConfig = appConfig
}

// ===== dimB / dimD 字典 =====
const DIM_B_MAP: Record<string, string> = {
  '01': '商场市场', '02': '宾馆饭店', '03': '公共娱乐场所', '04': '餐饮场所',
  '05': '医院', '06': '学校', '07': '养老福利机构', '08': '体育场馆',
  '09': '交通枢纽', '10': '劳动密集型企业', '11': '易燃易爆场所', '12': '高层公共建筑',
  '13': '地下建筑', '14': '大型商业综合体', '15': '文物古建筑', '16': '仓储物流',
  '17': '金融机构', '18': '通信枢纽', '19': '广播电视', '20': '发电厂/变电站',
  '21': '博物馆/展览馆', '22': '图书馆/档案馆', '23': '科研机构', '24': '旅游景区',
  '25': '宗教活动场所', '26': '住宅小区', '27': '党政机关', '28': '其他重点单位',
}

const DIM_D_MAP: Record<string, string> = {
  '1': '人员密集场所', '2': '高层建筑', '3': '地下建筑', '4': '易燃易爆场所',
  '5': '文物古建筑', '6': '大型商业综合体', '7': '工业建筑', '8': '普通商铺',
  '9': '办公建筑', '10': '交通建筑', '11': '医疗建筑', '12': '教育建筑', '99': '其他',
}

// ===== 计算属性 =====
const dimBLabel = computed(() => {
  if (!store.detail?.dimB) return '----'
  return DIM_B_MAP[store.detail.dimB] || store.detail.dimB
})

const dimDLabel = computed(() => {
  if (!store.detail?.dimD) return ''
  return DIM_D_MAP[store.detail.dimD] || ''
})

const tagsDisplay = computed(() => {
  const tags = store.detail?.tags
  if (!tags || tags.length === 0) return ''
  return tags.join('、')
})

const authPeriod = computed(() => {
  const d = store.detail
  if (!d) return '----'
  if (!d.validFrom && !d.validTo) return '----'
  return `${d.validFrom || '--'} 至 ${d.validTo || '--'}`
})

const contactDisplay = computed(() => {
  const d = store.detail
  if (!d) return '----'
  const name = d.contactName || ''
  const phone = d.contactPhone || ''
  if (!name && !phone) return '----'
  if (name && phone) return `${name} - ${phone}`
  return name || phone
})

// ===== 资源图片 =====
import entLogoPng from '@/assets/ent_logo.png'
import connectSvg from '@/assets/connect.svg'
import unitSvg from '@/assets/unit.svg'
import personSvg from '@/assets/person.svg'

// ===== 操作 =====
function handleBack() {
  router.push('/admin/enterpriseManagement/index')
}

function handleEdit() {
  openEditDrawer()
}

async function handleDelete() {
  if (!store.detail) return
  try {
    await confirmDeleteWithInput(
      store.detail.name,
      '删除后不可恢复。',
    )
    await store.handleBatchDelete([store.detail.id])
    router.push('/admin/enterpriseManagement/index')
  } catch (e: any) {
    // ElMessageBox 取消 / 关闭 → 静默忽略
    if (e === 'cancel' || e === 'close') return
    // API 错误 → 展示后端返回的错误信息
    const msg = e?.response?.data?.message || e?.message || '删除失败'
    ElMessage.error(msg)
  }
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

// ===== 初始化 =====
onMounted(() => {
  const id = route.query.id as string
  if (!id) {
    ElMessage.warning('参数错误，缺少企业 ID')
    router.push('/admin/enterpriseManagement/index')
    return
  }
  store.fetchDetail(id)
  store.fetchQrcode(id)
})
</script>

<style scoped>
/* ========== 页面容器 ========== */
.detail-page {
  /* padding: var(--spacing-lg); */
  height: 100%;
}

.content-card {
  background: var(--bg-sub-card);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  height: 100%;
}

/* ========== 顶部操作栏 ========== */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.action-bar-left {
  display: flex;
  align-items: center;
}

.action-bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ========== 轮廓按钮 ========== */
.btn-outline-primary,
.btn-outline-danger {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: var(--btn-height);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--btn-radius);
  font-size: var(--btn-font-size);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, opacity 0.2s;
}

.btn-outline-primary {
  background: var(--accent-primary10);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
}
.btn-outline-primary:hover {
  background: rgba(54, 120, 227, 0.15);
}

.btn-outline-danger {
  background: var(--semantic-danger-bg);
  color: var(--danger);
  border: 1px solid rgba(220, 38, 38, 0.2);
}
.btn-outline-danger:hover {
  background: rgba(220, 38, 38, 0.18);
}

.btn-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* ========== 企业头部卡片 ========== */
.header-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  flex-shrink: 0;
}

.header-card-body {
  display: flex;
  align-items: center;
  gap: var(--spacing-xxl);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 18px;
  flex: 1 1 0;
  min-width: 0;
}

/* ========== 公司 Logo ========== */
.company-logo {
  width: 78px;
  height: 78px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
  overflow: hidden;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  width: 100%;
  height: 100%;
  background: var(--accent-primary10);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-primary);
}

.logo-placeholder-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ========== 公司信息 ========== */
.company-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  padding: var(--spacing-md) 0;
  flex: 1 1 0;
  min-width: 0;
}

.company-name-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.company-name {
  font-size: var(--font-h3);
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  line-height: normal;
}

.company-tag {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-lg);
  background: var(--semantic-danger-bg);
  color: var(--danger);
  font-size: var(--font-small);
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;
  line-height: normal;
}

.company-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-line {
  font-size: var(--font-small);
  color: var(--text-tertiary);
  white-space: nowrap;
  line-height: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========== 分隔线 ========== */
.stat-divider {
  width: 1px;
  height: 78px;
  background: var(--border-default);
  flex-shrink: 0;
}

/* ========== 统计区域 ========== */
.company-stats {
  display: flex;
  align-items: center;
  gap: var(--spacing-xxl);
  flex: 0 1 auto;
  min-width: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 24px;
  flex: 1 1 0;
  min-width: 0;
}

.stat-icon-bg {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: var(--info-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon {
  width: 36px;
  height: 36px;
  color: var(--accent-primary);
}

.stat-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-width: 0;
}

.stat-label {
  font-size: var(--font-small);
  color: var(--text-secondary);
  white-space: nowrap;
  line-height: normal;
}

.stat-number {
  font-size: 24px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  line-height: normal;
}

.stat-number small {
  font-size: var(--font-small);
  font-weight: 500;
  color: var(--text-tertiary);
}

/* ========== 右侧：二维码 ========== */
.header-right {
  flex-shrink: 0;
}

.qrcode-container {
  width: 96px;
  height: 96px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  background: var(--bg-card);
  flex-shrink: 0;
}

.qrcode-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qrcode-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.qrcode-placeholder-icon {
  width: 40px;
  height: 40px;
}

/* ========== Tab 导航 ========== */
.tab-bar {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-default);
  flex-shrink: 0;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 18px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-body);
  color: var(--text-secondary);
  white-space: nowrap;
  line-height: normal;
  position: relative;
  transition: color 0.15s;
}

.tab-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 2px;
  background: transparent;
  transition: background 0.15s;
}

.tab-item:hover {
  color: var(--accent-primary);
}

.tab-item.active {
  color: var(--accent-primary);
}

.tab-item.active::after {
  background: var(--accent-primary);
}

/* ========== Tab 内容 ========== */
.tab-content {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}

.tab-content-inner {
  background: var(--bg-card);
  border-radius: 4px;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxl);
}

/* ========== 表单网格 ========== */
.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px 37px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}
.form-label {
  font-size: var(--font-small);
  color: var(--text-muted);
  white-space: nowrap;
  line-height: normal;
}

.form-value {
  font-size: var(--font-body);
  color: var(--text-primary);
  font-weight: 500;
  line-height: 25px;
  word-break: break-word;
}

/* ========== 分区标题 ========== */
.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.section-title {
  font-size: var(--font-body);
  font-weight: 400;
  color: var(--text-secondary);
  line-height: normal;
}

/* ========== 联系人卡片 ========== */
.contact-card {
  width: 265px;
  padding: var(--spacing-xl);
  background: rgba(147, 147, 147, 0.1);
  border-radius: var(--radius-md);
}

.contact-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.contact-name {
  font-size: var(--font-h3);
  color: var(--text-primary);
  line-height: 18px;
}

.contact-phone {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
}

.phone-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--text-primary);
}

.phone-label {
  font-size: var(--font-h3);
  color: var(--text-primary);
  line-height: 14px;
  white-space: nowrap;
}

.phone-number {
  font-size: var(--font-h3);
  color: var(--text-primary);
  line-height: 14px;
}

/* ========== 地图占位 ========== */
.map-container {
  width: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.map-placeholder {
  width: 100%;
  height: 240px;
  background: var(--info-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  color: var(--accent-primary);
}

.map-placeholder-icon {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

/* 详情页只读地图 */
.detail-map {
  width: 100%;
  height: 280px;
}

/* GIS 地址信息行 */
.gis-info-row {
  display: flex;
  gap: 24px;
  margin-top: 12px;
  padding: 12px 16px;
  background: var(--info-bg);
  border-radius: var(--radius-md);
}

.gis-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.gis-info-label {
  font-size: 13px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.gis-info-value {
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-placeholder-text {
  font-size: var(--font-small);
  color: var(--text-muted);
}

/* ========== Tab 占位 ========== */
.tab-stub {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border-radius: 4px;
}

.stub-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xl);
  color: var(--text-muted);
}

.stub-icon {
  width: 48px;
  height: 48px;
  opacity: 0.3;
}

.stub-text {
  font-size: var(--font-body);
  color: var(--text-muted);
}

/* ========== 个性化配置表单 ========== */
.branding-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px 37px;
}

.branding-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.branding-label {
  font-size: var(--font-small, 13px);
  color: var(--text-muted, #5E5E5E);
  white-space: nowrap;
}

/* ========== 保存按钮条 ========== */
.save-bar {
  display: flex;
  justify-content: flex-start;
  padding-top: var(--spacing-lg, 12px);
  border-top: 1px solid var(--border-default, #E9E9E9);
  margin-top: var(--spacing-lg, 12px);
}

/* ========== 空状态提示 ========== */
.empty-hint {
  padding: 24px;
  text-align: center;
  color: var(--text-muted, #5E5E5E);
  font-size: var(--font-small, 14px);
}

/* ========== 响应式 ========== */
@media (max-width: 1199px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .company-stats {
    gap: var(--spacing-lg);
  }

  .stat-item {
    padding: 0 var(--spacing-lg);
    gap: var(--spacing-lg);
  }
}

@media (max-width: 899px) {
  .header-card-body {
    flex-direction: column;
  }

  .header-left {
    flex-wrap: wrap;
  }

  .company-stats {
    flex-basis: 100%;
    justify-content: space-between;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .contact-card {
    width: 100%;
  }

  .tab-item {
    padding: 12px 18px;
    font-size: var(--font-small);
  }

  .action-bar {
    flex-direction: column;
    gap: var(--spacing-lg);
    align-items: stretch;
  }

  .action-bar-right {
    justify-content: flex-end;
  }
}

@media (max-width: 719px) {
  .header-left {
    flex-direction: column;
    align-items: flex-start;
  }

  .stat-divider {
    width: 100%;
    height: 1px;
  }

  .company-stats {
    flex-direction: column;
    width: 100%;
  }

  .stat-item {
    width: 100%;
    padding: 0;
  }

  .header-right {
    align-self: center;
  }
}

/* ===== 管理员账号卡片 ===== */
.admin-account-card {
  background: var(--bg-sub-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 16px 20px;
}
.admin-account-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.admin-account-row:last-of-type {
  margin-bottom: 12px;
}
.admin-label {
  font-size: 13px;
  color: var(--text-tertiary, #454545);
  min-width: 36px;
}
.admin-value {
  font-size: 14px;
  color: var(--text-primary, #101010);
  font-weight: 500;
}
.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid var(--border-light, #DEDEDE);
  border-radius: 4px;
  background: var(--bg-card, #fff);
  color: var(--text-secondary, #2E2E2E);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-copy:hover {
  background: var(--bg-sub-card, #FBFBFB);
}
.admin-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0;
  line-height: 1.6;
}
</style>
