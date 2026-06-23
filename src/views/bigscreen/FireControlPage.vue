<template>
  <div class="bigscreen">
    <BigscreenHeader />

    <div class="page-body">
      <!-- 标题行 -->
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-title">消防控制室管理</h1>
        </div>
        <button class="back-btn" title="返回大屏首页" @click="goBack">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- 辖区统计指标行 -->
      <div class="stats-row">
        <BigscreenMetricItem
          v-for="stat in jurisdictionStats"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :unit="stat.unit"
        />
      </div>

      <!-- 底部主内容区：左右分栏 -->
      <div class="page-content">
        <!-- 左侧：接入企业列表 -->
        <div class="enterprise-list-panel">
          <div class="enterprise-list__search">
            <svg class="enterprise-list__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
              <path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <input
              v-model="enterpriseSearch"
              class="enterprise-list__search-input"
              placeholder="搜索企业..."
            />
          </div>
          <div class="enterprise-list__body">
            <button
              v-for="ent in filteredEnterprises"
              :key="ent.id"
              class="enterprise-card"
              :class="{ 'is-active': selectedEnterprise?.id === ent.id }"
              @click="selectEnterprise(ent)"
            >
              <div class="enterprise-card__indicator" :class="ent.status" />
              <div class="enterprise-card__info">
                <span class="enterprise-card__name">{{ ent.name }}</span>
                <span class="enterprise-card__summary">
                  {{ ent.rooms.length }}间消控室 · {{ countOnDuty(ent.id) }}人在岗
                </span>
              </div>
              <svg v-if="selectedEnterprise?.id === ent.id" class="enterprise-card__check" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#3cd3d7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div v-if="filteredEnterprises.length === 0" class="enterprise-list__empty">无匹配结果</div>
          </div>
        </div>

        <!-- 右侧：企业详情面板 -->
        <div class="detail-panel">
          <!-- 企业信息头 -->
          <div class="detail-panel__ent-header">
            <span class="detail-panel__ent-name">{{ selectedEnterprise?.name }}</span>
            <span class="detail-panel__ent-meta">
              {{ selectedEnterprise?.address }} · {{ selectedEnterprise?.contactPerson }} · {{ selectedEnterprise?.contactPhone }}
            </span>
          </div>

          <!-- Seg 分段控制器 -->
          <div class="page-seg">
            <div
              v-for="tab in tabs"
              :key="tab.key"
              class="page-seg__item"
              :class="{ 'is-active': activeTab === tab.key }"
              @click="switchTab(tab.key)"
            >
              {{ tab.label }}
            </div>
          </div>

          <!-- 内容面板 -->
          <div class="page-content__panel">
            <FireControlMonitoring
              v-show="activeTab === 'monitoring'"
              :enterprise="selectedEnterprise!"
            />
            <FireControlDutyRecords
              v-show="activeTab === 'duty-records'"
              :records="currentDutyRecords"
            />
            <FireControlPersonnel
              v-show="activeTab === 'personnel'"
              :personnel="currentPersonnel"
            />
            <FireControlRollCall
              v-show="activeTab === 'roll-call'"
              :enterprise-id="selectedEnterprise!.id"
              :personnel="onDutyPersonnel"
              :records="currentRollCallRecords"
              @add-record="addRollCallRecord"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BigscreenHeader from './components/BigscreenHeader.vue'
import BigscreenMetricItem from './components/BigscreenMetricItem.vue'
import FireControlMonitoring from './components/yjj/FireControlMonitoring.vue'
import FireControlDutyRecords from './components/yjj/FireControlDutyRecords.vue'
import FireControlPersonnel from './components/yjj/FireControlPersonnel.vue'
import FireControlRollCall from './components/yjj/FireControlRollCall.vue'

// ============================================================
// Mock Data
// ============================================================

interface Camera {
  id: number
  name: string
  status: 'online' | 'offline'
  snapshotUrl: string
}

interface FireControlRoom {
  id: number
  name: string
  cameras: Camera[]
}

interface FireControlEnterprise {
  id: number
  name: string
  address: string
  contactPerson: string
  contactPhone: string
  rooms: FireControlRoom[]
  status: 'normal' | 'alert'
}

interface DutyRecord {
  id: number
  enterpriseId: number
  roomName: string
  personnelName: string
  shiftDate: string
  checkInTime: string
  checkOutTime: string | null
  status: 'on-time' | 'late' | 'absent'
  notes: string
}

interface DutyPersonnel {
  id: number
  enterpriseId: number
  name: string
  roomName: string
  position: string
  certificationNo: string
  certificationExpiry: string
  phone: string
  onDuty: boolean
}

interface RollCallRecord {
  id: number
  enterpriseId: number
  personnelName: string
  initiator: string
  callTime: string
  responseTime: string | null
  status: 'responded' | 'timeout'
  responseMethod: 'video' | 'voice' | null
}

// 摄像头截图资源（复用已有图片）
const camImgs = [
  new URL('@/assets/bigscreen/rsouce/them_1.png', import.meta.url).href,
  new URL('@/assets/bigscreen/rsouce/them_2.png', import.meta.url).href,
  new URL('@/assets/bigscreen/rsouce/them_3.png', import.meta.url).href,
  new URL('@/assets/bigscreen/rsouce/them_4.png', import.meta.url).href,
  new URL('@/assets/bigscreen/rsouce/them_5.png', import.meta.url).href,
  new URL('@/assets/bigscreen/rsouce/them_6.png', import.meta.url).href,
  new URL('@/assets/bigscreen/rsouce/them_7.png', import.meta.url).href,
  new URL('@/assets/bigscreen/rsouce/them_8.png', import.meta.url).href,
  new URL('@/assets/bigscreen/rsouce/them_9.png', import.meta.url).href,
]

const enterprises: FireControlEnterprise[] = [
  {
    id: 1,
    name: '阳光物业集团',
    address: '江南区中山路188号',
    contactPerson: '陈志强',
    contactPhone: '138-7711-2201',
    status: 'normal',
    rooms: [
      { id: 101, name: '1#消控室', cameras: [
        { id: 1, name: 'CAM-01', status: 'online', snapshotUrl: camImgs[0] },
        { id: 2, name: 'CAM-02', status: 'online', snapshotUrl: camImgs[1] },
        { id: 3, name: 'CAM-03', status: 'online', snapshotUrl: camImgs[2] },
        { id: 4, name: 'CAM-04', status: 'online', snapshotUrl: camImgs[3] },
      ]},
      { id: 102, name: '2#消控室', cameras: [
        { id: 5, name: 'CAM-01', status: 'online', snapshotUrl: camImgs[4] },
        { id: 6, name: 'CAM-02', status: 'offline', snapshotUrl: camImgs[5] },
      ]},
    ],
  },
  {
    id: 2,
    name: '华联商超',
    address: '江南区人民路56号',
    contactPerson: '李建国',
    contactPhone: '139-7852-3312',
    status: 'normal',
    rooms: [
      { id: 201, name: '1#消控室', cameras: [
        { id: 7, name: 'CAM-01', status: 'online', snapshotUrl: camImgs[6] },
        { id: 8, name: 'CAM-02', status: 'online', snapshotUrl: camImgs[7] },
        { id: 9, name: 'CAM-03', status: 'offline', snapshotUrl: camImgs[8] },
      ]},
      { id: 202, name: '2#消控室', cameras: [
        { id: 10, name: 'CAM-01', status: 'online', snapshotUrl: camImgs[0] },
        { id: 11, name: 'CAM-02', status: 'online', snapshotUrl: camImgs[1] },
      ]},
    ],
  },
  {
    id: 3,
    name: '锦江国际酒店',
    address: '江南区滨江大道99号',
    contactPerson: '王建国',
    contactPhone: '137-6833-4423',
    status: 'normal',
    rooms: [
      { id: 301, name: '1#消控室', cameras: [
        { id: 12, name: 'CAM-01', status: 'online', snapshotUrl: camImgs[2] },
        { id: 13, name: 'CAM-02', status: 'online', snapshotUrl: camImgs[3] },
      ]},
      { id: 302, name: '2#消控室', cameras: [
        { id: 14, name: 'CAM-01', status: 'online', snapshotUrl: camImgs[4] },
        { id: 15, name: 'CAM-02', status: 'online', snapshotUrl: camImgs[5] },
        { id: 16, name: 'CAM-03', status: 'offline', snapshotUrl: camImgs[6] },
      ]},
    ],
  },
  {
    id: 4,
    name: '市第一人民医院',
    address: '江南区健康路1号',
    contactPerson: '赵建国',
    contactPhone: '136-7744-5534',
    status: 'alert',
    rooms: [
      { id: 401, name: '1#消控室', cameras: [
        { id: 17, name: 'CAM-01', status: 'online', snapshotUrl: camImgs[7] },
        { id: 18, name: 'CAM-02', status: 'offline', snapshotUrl: camImgs[8] },
      ]},
      { id: 402, name: '2#消控室', cameras: [
        { id: 19, name: 'CAM-01', status: 'online', snapshotUrl: camImgs[0] },
        { id: 20, name: 'CAM-02', status: 'online', snapshotUrl: camImgs[1] },
      ]},
      { id: 403, name: '3#消控室', cameras: [
        { id: 21, name: 'CAM-01', status: 'online', snapshotUrl: camImgs[2] },
        { id: 22, name: 'CAM-02', status: 'online', snapshotUrl: camImgs[3] },
      ]},
    ],
  },
  {
    id: 5,
    name: '育才实验学校',
    address: '江南区学府路128号',
    contactPerson: '刘伟',
    contactPhone: '135-6655-6645',
    status: 'normal',
    rooms: [
      { id: 501, name: '1#消控室', cameras: [
        { id: 23, name: 'CAM-01', status: 'online', snapshotUrl: camImgs[4] },
        { id: 24, name: 'CAM-02', status: 'online', snapshotUrl: camImgs[5] },
        { id: 25, name: 'CAM-03', status: 'online', snapshotUrl: camImgs[6] },
      ]},
    ],
  },
  {
    id: 6,
    name: '东方化工厂',
    address: '江南区工业园区18号',
    contactPerson: '周强',
    contactPhone: '158-7866-7756',
    status: 'normal',
    rooms: [
      { id: 601, name: '1#消控室', cameras: [
        { id: 26, name: 'CAM-01', status: 'online', snapshotUrl: camImgs[7] },
        { id: 27, name: 'CAM-02', status: 'online', snapshotUrl: camImgs[8] },
        { id: 28, name: 'CAM-03', status: 'offline', snapshotUrl: camImgs[0] },
        { id: 29, name: 'CAM-04', status: 'online', snapshotUrl: camImgs[1] },
      ]},
      { id: 602, name: '2#消控室', cameras: [
        { id: 30, name: 'CAM-01', status: 'online', snapshotUrl: camImgs[2] },
        { id: 31, name: 'CAM-02', status: 'offline', snapshotUrl: camImgs[3] },
      ]},
    ],
  },
]

// 值班人员
const allPersonnel: DutyPersonnel[] = [
  { id: 1, enterpriseId: 1, name: '张建国', roomName: '1#消控室', position: '消控值班员', certificationNo: 'XF20240315001', certificationExpiry: '2027-03-15', phone: '138-1111-1001', onDuty: true },
  { id: 2, enterpriseId: 1, name: '李明辉', roomName: '1#消控室', position: '消控值班员', certificationNo: 'XF20230822002', certificationExpiry: '2026-08-22', phone: '138-1111-1002', onDuty: true },
  { id: 3, enterpriseId: 1, name: '王海涛', roomName: '2#消控室', position: '消控值班员', certificationNo: 'XF20240610003', certificationExpiry: '2026-12-10', phone: '138-1111-1003', onDuty: false },
  { id: 4, enterpriseId: 1, name: '赵刚', roomName: '2#消控室', position: '消控值班长', certificationNo: 'XF20210905004', certificationExpiry: '2026-09-05', phone: '138-1111-1004', onDuty: false },
  { id: 5, enterpriseId: 2, name: '刘强', roomName: '1#消控室', position: '消控值班员', certificationNo: 'XF20250120005', certificationExpiry: '2028-01-20', phone: '139-2222-2001', onDuty: true },
  { id: 6, enterpriseId: 2, name: '陈伟', roomName: '1#消控室', position: '消控值班员', certificationNo: 'XF20231201006', certificationExpiry: '2026-12-01', phone: '139-2222-2002', onDuty: false },
  { id: 7, enterpriseId: 2, name: '孙鹏', roomName: '2#消控室', position: '消控值班员', certificationNo: 'XF20240715007', certificationExpiry: '2027-07-15', phone: '139-2222-2003', onDuty: true },
  { id: 8, enterpriseId: 3, name: '杨帆', roomName: '1#消控室', position: '消控值班长', certificationNo: 'XF20220228008', certificationExpiry: '2027-02-28', phone: '137-3333-3001', onDuty: true },
  { id: 9, enterpriseId: 3, name: '黄磊', roomName: '1#消控室', position: '消控值班员', certificationNo: 'XF20241130009', certificationExpiry: '2027-11-30', phone: '137-3333-3002', onDuty: false },
  { id: 10, enterpriseId: 3, name: '吴强', roomName: '2#消控室', position: '消控值班员', certificationNo: 'XF20230518010', certificationExpiry: '2026-05-18', phone: '137-3333-3003', onDuty: true },
  { id: 11, enterpriseId: 3, name: '何伟', roomName: '2#消控室', position: '消控值班员', certificationNo: 'XF20240812011', certificationExpiry: '2027-08-12', phone: '137-3333-3004', onDuty: true },
  { id: 12, enterpriseId: 4, name: '马超', roomName: '1#消控室', position: '消控值班长', certificationNo: 'XF20211020012', certificationExpiry: '2026-10-20', phone: '136-4444-4001', onDuty: true },
  { id: 13, enterpriseId: 4, name: '林涛', roomName: '1#消控室', position: '消控值班员', certificationNo: 'XF20250401013', certificationExpiry: '2028-04-01', phone: '136-4444-4002', onDuty: true },
  { id: 14, enterpriseId: 4, name: '郑刚', roomName: '2#消控室', position: '消控值班员', certificationNo: 'XF20230615014', certificationExpiry: '2026-06-15', phone: '136-4444-4003', onDuty: false },
  { id: 15, enterpriseId: 4, name: '谢飞', roomName: '3#消控室', position: '消控值班员', certificationNo: 'XF20240908015', certificationExpiry: '2027-09-08', phone: '136-4444-4004', onDuty: true },
  { id: 16, enterpriseId: 5, name: '钱进', roomName: '1#消控室', position: '消控值班员', certificationNo: 'XF20240112016', certificationExpiry: '2027-01-12', phone: '135-5555-5001', onDuty: true },
  { id: 17, enterpriseId: 5, name: '周明', roomName: '1#消控室', position: '消控值班员', certificationNo: 'XF20230725017', certificationExpiry: '2026-07-25', phone: '135-5555-5002', onDuty: false },
  { id: 18, enterpriseId: 5, name: '邓丽', roomName: '1#消控室', position: '消控值班长', certificationNo: 'XF20220830018', certificationExpiry: '2027-08-30', phone: '135-5555-5003', onDuty: true },
  { id: 19, enterpriseId: 6, name: '彭涛', roomName: '1#消控室', position: '消控值班员', certificationNo: 'XF20241201019', certificationExpiry: '2027-12-01', phone: '158-6666-6001', onDuty: true },
  { id: 20, enterpriseId: 6, name: '郭海', roomName: '1#消控室', position: '消控值班员', certificationNo: 'XF20230314020', certificationExpiry: '2026-03-14', phone: '158-6666-6002', onDuty: true },
  { id: 21, enterpriseId: 6, name: '唐亮', roomName: '2#消控室', position: '消控值班长', certificationNo: 'XF20210622021', certificationExpiry: '2026-06-22', phone: '158-6666-6003', onDuty: false },
  { id: 22, enterpriseId: 6, name: '杨帆', roomName: '2#消控室', position: '消控值班员', certificationNo: 'XF20250910022', certificationExpiry: '2028-09-10', phone: '158-6666-6004', onDuty: true },
]

// 值班记录（每个企业 ~10 条，近几日）
function generateDutyRecords(): DutyRecord[] {
  const records: DutyRecord[] = []
  const names = ['张建国','李明辉','王海涛','赵刚','刘强','陈伟','孙鹏','杨帆','黄磊','吴强','何伟','马超','林涛','郑刚','谢飞','钱进','周明','邓丽','彭涛','郭海','唐亮','杨帆']
  const statuses: DutyRecord['status'][] = ['on-time', 'on-time', 'on-time', 'on-time', 'late', 'on-time', 'on-time', 'absent', 'on-time', 'on-time']
  let id = 1
  enterprises.forEach(ent => {
    ent.rooms.forEach(room => {
      for (let d = 0; d < 5; d++) {
        const date = new Date()
        date.setDate(date.getDate() - d)
        const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
        const st = statuses[(ent.id + d) % statuses.length]
        records.push({
          id: id++,
          enterpriseId: ent.id,
          roomName: room.name,
          personnelName: names[(ent.id * 3 + d) % names.length],
          shiftDate: ds,
          checkInTime: st === 'absent' ? '--' : `${String(7 + Math.floor(Math.random()*2)).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`,
          checkOutTime: st === 'absent' ? '--' : `${String(19 + Math.floor(Math.random()*2)).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`,
          status: st,
          notes: st === 'late' ? '迟到12分钟' : st === 'absent' ? '未到岗' : '',
        })
      }
    })
  })
  return records
}

// 点名记录
function generateRollCallRecords(): RollCallRecord[] {
  const records: RollCallRecord[] = []
  const names = ['张建国','李明辉','刘强','孙鹏','杨帆','吴强','何伟','马超','林涛','谢飞','钱进','邓丽','彭涛','郭海','杨帆']
  const methods: RollCallRecord['responseMethod'][] = ['video', 'voice', 'voice', 'video', 'voice']
  let id = 1
  enterprises.forEach(ent => {
    for (let i = 0; i < 5; i++) {
      const responded = i < 4 // 4/5 应答
      records.push({
        id: id++,
        enterpriseId: ent.id,
        personnelName: names[(ent.id * 2 + i) % names.length],
        initiator: '应急局监管员-张华',
        callTime: `2026-06-${String(20 - i).padStart(2,'0')} ${String(9 + Math.floor(Math.random()*8)).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`,
        responseTime: responded ? `2026-06-${String(20 - i).padStart(2,'0')} ${String(9 + Math.floor(Math.random()*8)).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}` : null,
        status: responded ? 'responded' : 'timeout',
        responseMethod: responded ? methods[i % methods.length] : null,
      })
    }
  })
  return records
}

const allDutyRecords = ref<DutyRecord[]>(generateDutyRecords())
const allRollCallRecords = ref<RollCallRecord[]>(generateRollCallRecords())

// ============================================================
// 状态
// ============================================================

const router = useRouter()
const selectedEnterprise = ref<FireControlEnterprise>(enterprises[0])
const enterpriseSearch = ref('')
const activeTab = ref('monitoring')

const tabs = [
  { key: 'monitoring', label: '实时监控' },
  { key: 'duty-records', label: '值班记录' },
  { key: 'personnel', label: '值班人员' },
  { key: 'roll-call', label: '远程点名' },
]

// ============================================================
// 计算属性
// ============================================================

const filteredEnterprises = computed(() => {
  const kw = enterpriseSearch.value.trim().toLowerCase()
  if (!kw) return enterprises
  return enterprises.filter(e => e.name.toLowerCase().includes(kw))
})

// 辖区级统计
const jurisdictionStats = computed(() => {
  const totalRooms = enterprises.reduce((sum, e) => sum + e.rooms.length, 0)
  const allCameras = enterprises.flatMap(e => e.rooms.flatMap(r => r.cameras))
  const totalCameras = allCameras.length
  const onlineCameras = allCameras.filter(c => c.status === 'online').length
  const totalOnDuty = allPersonnel.filter(p => p.onDuty).length
  const totalRecords = allDutyRecords.value.filter(r => r.shiftDate === today()).length

  return [
    { label: '纳管企业', value: enterprises.length, unit: '家' },
    { label: '消控室总数', value: totalRooms, unit: '间' },
    { label: '摄像头总数', value: totalCameras, unit: '个' },
    { label: '摄像头在线率', value: totalCameras > 0 ? (onlineCameras / totalCameras * 100).toFixed(1) : '0', unit: '%' },
    { label: '在岗值班人员', value: totalOnDuty, unit: '人' },
    { label: '今日值班记录', value: totalRecords, unit: '条' },
  ]
})

const currentDutyRecords = computed(() =>
  allDutyRecords.value.filter(r => r.enterpriseId === selectedEnterprise.value?.id)
)

const currentPersonnel = computed(() =>
  allPersonnel.filter(p => p.enterpriseId === selectedEnterprise.value?.id)
)

const onDutyPersonnel = computed(() =>
  currentPersonnel.value.filter(p => p.onDuty)
)

const currentRollCallRecords = computed(() =>
  allRollCallRecords.value.filter(r => r.enterpriseId === selectedEnterprise.value?.id)
)

// ============================================================
// 方法
// ============================================================

function selectEnterprise(ent: FireControlEnterprise) {
  selectedEnterprise.value = ent
}

function switchTab(key: string) {
  activeTab.value = key
}

function goBack() {
  router.push({ name: 'BigscreenLanding' })
}

function countOnDuty(enterpriseId: number): number {
  return allPersonnel.filter(p => p.enterpriseId === enterpriseId && p.onDuty).length
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

let nextRollCallId = allRollCallRecords.value.length + 1
function addRollCallRecord(record: Omit<RollCallRecord, 'id'>) {
  allRollCallRecords.value.unshift({ id: nextRollCallId++, ...record })
}
</script>

<style scoped>
/* ===== 全屏容器 ===== */
.bigscreen {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(50% 50% at 50% 50%, #003F76 0%, #002C62 100%);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ===== 内容区 ===== */
.page-body {
  position: absolute;
  top: calc(89 * var(--h));
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  padding: calc(18 * var(--h)) calc(18 * var(--w));
  display: flex;
  flex-direction: column;
  gap: calc(18 * var(--h));
  background: #002C62;
}

.page-body::-webkit-scrollbar { width: 4px; }
.page-body::-webkit-scrollbar-track { background: transparent; }
.page-body::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.3); border-radius: 2px; }

/* ===== 标题行 ===== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.page-header__left {
  display: flex;
  align-items: center;
  gap: calc(12 * var(--w));
  min-width: 0;
}

.page-title {
  font-family: 'Source-KeynoteartHans', 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(18px, calc(22 * var(--min-scale)), 26px);
  font-weight: 400;
  line-height: normal;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  flex-shrink: 0;
}

.back-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(71, 132, 232, 0.4);
  border-radius: 4px;
  background: rgba(2, 20, 50, 0.6);
  color: #89b5ff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.back-btn:hover {
  background: rgba(71, 132, 232, 0.25);
  border-color: rgba(71, 132, 232, 0.7);
  color: #3cd3d7;
}

/* ===== 统计指标行 ===== */
.stats-row {
  display: flex;
  gap: calc(16 * var(--w));
  padding: calc(16 * var(--h)) calc(16 * var(--w));
  background: rgba(22, 70, 145, 0.51);
  border-radius: 6px;
  flex-shrink: 0;
}

.stats-row > * {
  flex: 1;
  min-width: 0;
}

/* ===== 底部主内容区 ===== */
.page-content {
  flex: 1;
  display: flex;
  gap: calc(16 * var(--w));
  min-height: 0;
}

/* ===== 左侧企业列表 ===== */
.enterprise-list-panel {
  flex: 0 0 calc(320 * var(--w));
  max-width: 360px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  background: rgba(22, 70, 145, 0.51);
  border-radius: 6px;
  overflow: hidden;
}

.enterprise-list__search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: calc(10 * var(--h)) calc(10 * var(--w));
  border-bottom: 1px solid rgba(71, 132, 232, 0.18);
  flex-shrink: 0;
}

.enterprise-list__search-icon {
  color: rgba(137, 181, 255, 0.5);
  flex-shrink: 0;
}

.enterprise-list__search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #89b5ff;
  font-family: inherit;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
  padding: 0;
}
.enterprise-list__search-input::placeholder {
  color: rgba(137, 181, 255, 0.35);
}

.enterprise-list__body {
  flex: 1;
  overflow-y: auto;
  padding: calc(6 * var(--h)) calc(8 * var(--w));
}
.enterprise-list__body::-webkit-scrollbar { width: 3px; }
.enterprise-list__body::-webkit-scrollbar-track { background: transparent; }
.enterprise-list__body::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.25); border-radius: 2px; }

.enterprise-card {
  display: flex;
  align-items: center;
  gap: calc(8 * var(--w));
  width: 100%;
  padding: calc(10 * var(--h)) calc(10 * var(--w));
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: all 0.2s;
  margin-bottom: calc(4 * var(--h));
}
.enterprise-card:hover {
  background: rgba(71, 132, 232, 0.15);
  border-color: rgba(71, 132, 232, 0.25);
}
.enterprise-card.is-active {
  background: rgba(71, 132, 232, 0.2);
  border-color: rgba(71, 132, 232, 0.45);
  box-shadow: 0 0 12px rgba(71, 132, 232, 0.15);
}

.enterprise-card__indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.enterprise-card__indicator.normal {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
}
.enterprise-card__indicator.alert {
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
}

.enterprise-card__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.enterprise-card__name {
  font-size: clamp(13px, calc(14 * var(--min-scale)), 16px);
  font-weight: 600;
  color: #f2fbff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.enterprise-card__summary {
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  color: rgba(137, 181, 255, 0.6);
}

.enterprise-card__check {
  flex-shrink: 0;
}

.enterprise-list__empty {
  padding: 20px 10px;
  text-align: center;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
  color: rgba(137, 181, 255, 0.4);
}

/* ===== 右侧详情面板 ===== */
.detail-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: rgba(22, 70, 145, 0.51);
  border-radius: 6px;
  overflow: hidden;
  padding: calc(12 * var(--h)) calc(14 * var(--w));
  gap: 0;
}

.detail-panel__ent-header {
  display: flex;
  align-items: baseline;
  gap: calc(12 * var(--w));
  flex-shrink: 0;
  padding-bottom: calc(10 * var(--h));
  border-bottom: 1px solid rgba(71, 132, 232, 0.2);
}

.detail-panel__ent-name {
  font-family: 'Source-KeynoteartHans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(16px, calc(18 * var(--min-scale)), 20px);
  font-weight: 700;
  color: #ffffff;
  flex-shrink: 0;
}

.detail-panel__ent-meta {
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
  color: rgba(137, 181, 255, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== Seg 分段控制器 ===== */
.page-seg {
  display: flex;
  gap: calc(18 * var(--w));
  flex-shrink: 0;
  padding: calc(10 * var(--h)) 0;
}

.page-seg__item {
  flex-shrink: 0;
  padding: calc(8 * var(--h)) calc(16 * var(--w));
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 18px);
  font-weight: 700;
  text-align: center;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  cursor: pointer;
  transition: all 0.25s ease;
}

.page-seg__item.is-active {
  background: rgba(22, 70, 145, 0.51);
  -webkit-text-fill-color: #ffffff;
  color: #ffffff;
  border-radius: 8px 8px 0 0;
}

/* ===== 内容面板 ===== */
.page-content__panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: transparent;
}
</style>
