<template>
  <section class="plan">
    <!-- ===== 标题条（设计稿 #134:531） ===== -->
    <header class="plan__bar">
      <span class="plan__title">平面图</span>
      <span class="plan__scope">
        {{ scopeLabel }} · {{ devices.length }} 台设备
        <template v-if="eventCount"> · {{ eventCount }} 条警情</template>
        <template v-if="overflow"> · 显示前 {{ plotted.length }} 台</template>
        <template v-if="located"> · 已定位「{{ located.label }}」</template>
      </span>
    </header>

    <!-- ===== 平面图内容（设计稿 #140:25704） ===== -->
    <div class="plan__body">
      <div class="plan__stage">
        <!-- CAD 底图（设计稿 #140:25702，Figma 原图） -->
        <img class="plan__base" :src="baseImage" alt="建筑平面图" />

        <!-- 设备点位：一台设备一个图元 -->
        <div
          v-for="d in plotted"
          :key="d.key"
          class="plan__point"
          :class="{ 'is-alarmed': !!d.event, 'is-located': d.key === locateKey }"
          :style="d.style"
          :title="d.tip"
        >
          <img class="plan__point-img" :src="d.icon" :alt="d.label" />
          <span v-if="d.event" class="plan__point-tag">{{ d.event.category }}</span>
        </div>

        <!-- 定位标签：浮在设备列表层之上，保证「定位到平面图」这一下始终看得见 -->
        <span v-if="located" class="plan__locate" :style="located.tagStyle">
          <span class="plan__locate-name">{{ located.label }}</span>
          <span v-if="located.event" class="plan__locate-cat">{{ located.event.category }}</span>
        </span>

        <!-- 当前范围内没有设备 -->
        <span v-if="!plotted.length" class="plan__empty">该管理单元下暂无设备点位</span>
      </div>

      <!-- 设备列表层：浮在平面图之上（设计稿 #160:25871「设备列表」） -->
      <EbikeV2DutyDeviceList
        class="plan__devices"
        :devices="devices"
        :locate-key="locateKey"
        @locate="locateKey = $event"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 实时警情页 · 平面图（消防 CRT 式点位图）
 *
 * 版式按 Figma「智能安全管控平台/实时警情」节点 86:8287 的平面图卡 #134:530：
 *
 *   标题条  #134:531：高 36、横向渐变 rgba(6,64,110,1)→透明、底边 rgba(128,209,253,.15)、
 *           标题「平面图」Inter Black 900 15px #A2CAFF
 *   内容框  #140:25704：内距 12
 *     底图  #140:25702：CAD 平面图（object-fit: contain）
 *     图元  5 个绝对定位的设备图标（58~64 见方，带 0 4px 10.5px 投影）
 *     设备列表 #160:25871：浮在平面图之上的绝对定位区块（展开时占内容高度 56%，
 *             折叠时只剩标题条），见 EbikeV2DutyDeviceList.vue
 *
 * 语义：这是消防 CRT 的「平面图描点」——
 *   图上一个点 = 一台设备（不是一类设备的聚合），点位落在平面图里的位置；
 *   设备报警时该点标红（设计稿给告警图元加了 2px 红描边），一眼能看出
 *   报警设备在平面图的哪个位置、也就是哪栋楼哪层。
 *
 * 两层的关系：平面图是「在哪」，设备列表是「有哪些」——
 *   列表点「定位」→ 平面图上对应的那一点描一圈选中蓝，并浮出一枚标签
 *   （标签压在设备列表层之上：列表展开时盖住了图的下半部分，
 *     没有这枚标签，用户点了「定位」看不到任何反应）。
 *   列表默认把有事件的设备置顶，值班员扫一眼顶部就知道哪些在报警。
 *
 * 坐标：设计稿的图元位置相对「内容框 1479×820」给出，而底图是 contain 落位
 * （实际只占中间 1011×818，两侧是留白）。这里把舞台取成底图那块，
 * 机位坐标同步换算到舞台坐标系，底图与图元仍然严丝合缝。
 *
 * 设备图标按设备族归类（设计稿给了 5 枚设备图，正好对上 5 个设备族）：
 *   主机 / 控制柜 / 模块 → 消防火灾监控主机面板
 *   气体探测            → 燃气探测器
 *   探测报警            → 烟雾报警器_4g
 *   末端灭火 / 手动报警  → 火灾报警按钮（消火栓按钮同款红圆钮）
 *   水务机组 / 阀组     → 防爆感烟火灾探测器（白色圆形设备图元）
 *
 * 与设计稿的有意偏离：
 *   1. 告警描边用项目异常红 #ff8080（设计稿 #E74E4E，同属异常红一族），
 *      并加一圈缓慢呼吸的光晕 —— 大屏远看时"哪个点在报警"必须一眼可见。
 *   2. 告警点位带一个类别角标（火警 / 故障 / 预警），设计稿只有描边；
 *      角标文案承担档位区分，颜色不区分（全页只留一个红）。
 *   3. 设计稿只有 5 个机位，这里按设计稿机位 + 规则网格补足到 33 个，
 *      设备多于机位时标题条会提示"显示前 N 台"。
 */
import { computed, ref } from 'vue'
import { formatTime, type DutyEvent, type SceneDevice } from './duty-data'
import EbikeV2DutyDeviceList from './EbikeV2DutyDeviceList.vue'

const props = defineProps<{
  /** 当前管理单元内的全部设备（含未报警的），带警情 */
  devices: Array<SceneDevice & { event?: DutyEvent }>
  /** 当前管理单元名称 */
  scopeLabel: string
  /** 当前管理单元内的待核实事件条数（与左侧树的红字同一口径） */
  eventCount: number
}>()

/** 被「定位」的设备 key（设备列表点操作列时高亮平面图上对应的那一点） */
const locateKey = ref('')

/* ============================================================
 * 舞台坐标
 * ============================================================ */

/** 舞台 = 底图实际落位的那块（设计稿内容框 1479×820 里 contain 后占中间 1011×818） */
const STAGE_W = 1014
const STAGE_H = 820

/** CAD 底图与设备图元（Figma 原图） */
const baseImage = new URL('@/assets/bigscreen/ebike-v2/duty/floor-plan.png', import.meta.url).href
const IMG = {
  smokeProof: new URL('@/assets/bigscreen/ebike-v2/duty/device-smoke-proof.png', import.meta.url)
    .href,
  smokeDetector: new URL('@/assets/bigscreen/ebike-v2/duty/device-smoke-detector.png', import.meta.url)
    .href,
  manualCall: new URL('@/assets/bigscreen/ebike-v2/duty/device-manual-call.png', import.meta.url)
    .href,
  panel: new URL('@/assets/bigscreen/ebike-v2/duty/device-4.png', import.meta.url).href,
  gas: new URL('@/assets/bigscreen/ebike-v2/duty/device-gas.png', import.meta.url).href,
}

/* ============================================================
 * 图标归族
 * ============================================================ */

/** 图元符号 → 设备族 → 图标 */
const ICON_BY_SYMBOL: Record<string, string> = {
  // 主机 / 控制柜 / 输入输出模块 → 消防火灾监控主机面板
  'FWMS-MH-01': IMG.panel,
  'CAB-PMP-01': IMG.panel,
  'GFES-MH-01': IMG.panel,
  'SCS-MH-01': IMG.panel,
  'CUS-IOM-01': IMG.panel,
  'CUS-INM-01': IMG.panel,
  // 气体探测 → 燃气探测器
  'GFES-PD-01': IMG.gas,
  // 探测报警 → 烟雾报警器_4g
  'CUS-EFD-01': IMG.smokeDetector,
  'CUS-THS-01': IMG.smokeDetector,
  'CUS-PSW-01': IMG.smokeDetector,
  'CUS-WIM-01': IMG.smokeDetector,
  'CUS-FTM-01': IMG.smokeDetector,
  'CUS-LEV-01': IMG.smokeDetector,
  'SCS-RPD-01': IMG.smokeDetector,
  // 末端灭火 / 手动报警 → 火灾报警按钮（消火栓按钮同款红圆钮）
  'HYD-IND-01': IMG.manualCall,
  'HYD-HOSE-01': IMG.manualCall,
  'SPK-SPR-01': IMG.manualCall,
  'TST-TEST-01': IMG.manualCall,
  'CUS-ATS-01': IMG.manualCall,
  'CUS-MTS-01': IMG.manualCall,
  // 水务机组 / 阀组 / 阀门 / 压力表 → 防爆感烟火灾探测器（白色圆形设备图元）
  'TNK-FIRE-01': IMG.smokeProof,
  'RES-TANK-01': IMG.smokeProof,
  'PMP-SET-01': IMG.smokeProof,
  'PMP-STAB-01': IMG.smokeProof,
  'VES-PRE-01': IMG.smokeProof,
  'ALV-GRP-01': IMG.smokeProof,
  'PAI-SPG-01': IMG.smokeProof,
  'VLV-BUTT-01': IMG.smokeProof,
  'VLV-GATE-01': IMG.smokeProof,
  'VLV-CHK-01': IMG.smokeProof,
  'VLV-SIG-01': IMG.smokeProof,
  'CON-OUT-01': IMG.smokeProof,
}

/** 取设备图标；未知符号退到白色圆形设备图元 */
function iconOf(symbol: string): string {
  return ICON_BY_SYMBOL[symbol] ?? IMG.smokeProof
}

/* ============================================================
 * 机位表
 * ============================================================ */

interface Slot {
  /** 机位中心 x（底图坐标系） */
  x: number
  /** 机位中心 y（底图坐标系） */
  y: number
  /** 图元边长 */
  size: number
}

/**
 * 设计稿的 5 个机位（底图坐标系，原点在底图左上角）
 *
 * 设计稿给的是相对「内容框 1479×820」的左上角坐标，底图 contain 后落在中间
 * 1011×818，两侧各留 234 空白，所以要减去 234 才是底图坐标：
 *   烟雾报警器_4g        (380,248) → (146,248)
 *   防爆感烟火灾探测器    (716,303) → (482,303)
 *   火灾报警按钮          (460,542) → (226,542)
 *   消防火灾监控主机      (682,641) → (448,641)
 *   燃气探测器            (932,626) → (698,626)
 */
const DESIGN_SLOTS: Slot[] = [
  { x: 146 + 32, y: 248 + 32, size: 64 },
  { x: 482 + 29, y: 303 + 29, size: 58 },
  { x: 226 + 32, y: 542 + 32, size: 64 },
  { x: 448 + 24.5, y: 641 + 24.5, size: 49 },
  { x: 698 + 32, y: 626 + 32, size: 64 },
]

/** 续位：设计稿机位之外按 6×5 规则网格排，格子与设计稿机位重叠的跳过 */
function buildGridSlots(): Slot[] {
  const out: Slot[] = []
  const size = 52
  const gap = 4
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
      const x = 62 + c * 150
      const y = 58 + r * 165
      const hit = DESIGN_SLOTS.some((s) => {
        const need = (s.size + size) / 2 + gap
        return Math.hypot(s.x - x, s.y - y) < need
      })
      if (!hit) out.push({ x, y, size })
    }
  }
  return out
}

/** 全部机位：先设计稿的 5 个，再续位网格 */
const SLOTS: Slot[] = [...DESIGN_SLOTS, ...buildGridSlots()]

/* ============================================================
 * 描点
 * ============================================================ */

/** 描点结果：报警的点排在前面，其余按设备名排 */
const plotted = computed(() => {
  const sorted = [...props.devices].sort((a, b) => {
    if (!!a.event !== !!b.event) return a.event ? -1 : 1
    return a.label.localeCompare(b.label, 'zh-Hans-CN')
  })

  return sorted.slice(0, SLOTS.length).map((d, i) => {
    const slot = SLOTS[i]
    return {
      key: d.key,
      label: d.label,
      icon: iconOf(d.symbol),
      event: d.event,
      style: {
        left: `${((slot.x - slot.size / 2) / STAGE_W) * 100}%`,
        top: `${((slot.y - slot.size / 2) / STAGE_H) * 100}%`,
        width: `${(slot.size / STAGE_W) * 100}%`,
      },
      /** 定位标签的落点（点位中心，百分比坐标） */
      tagStyle: {
        left: `${(slot.x / STAGE_W) * 100}%`,
        top: `${(slot.y / STAGE_H) * 100}%`,
      },
      tip: d.event
        ? `${d.label} · ${d.event.point}（${d.event.category}）\n${d.event.location} · ${formatTime(d.event.latestAt)}`
        : `${d.label} · 当前无警情`,
    }
  })
})

/** 设备数超出机位表（提示只画了前 N 台） */
const overflow = computed(() => props.devices.length > plotted.value.length)

/** 被定位的那台设备（不在当前机位里就没有标签） */
const located = computed(() => plotted.value.find((d) => d.key === locateKey.value))
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../fire/fire-common.scss" as *;

/* 卡片：设计稿 #134:530 */
.plan {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 152, 230, 0.16);
  border-radius: vw(3);
  background: rgba(0, 44, 94, 0.72);
  overflow: hidden;
}

/* ===== 标题条：设计稿 #134:531 ===== */
.plan__bar {
  flex-shrink: 0;
  height: vh(36);
  display: flex;
  align-items: center;
  gap: vw(8);
  padding: 0 vw(10);
  background: linear-gradient(90deg, rgba(6, 64, 110, 1) 0%, rgba(6, 64, 110, 0) 100%);
  border-bottom: 1px solid rgba(128, 209, 253, 0.15);
}

.plan__title {
  /* 设计稿 Inter Black 900；中文字体没有 900 这一档，换字体而不是只加字重 */
  font-family: 'SectionTitleHans', 'PingFang SC', sans-serif;
  font-weight: 900;
  font-size: clamp(14px, calc(15px * var(--min-scale)), 15px);
  color: #a2caff;
  line-height: 1;
  white-space: nowrap;
}

/* 当前范围（右对齐） */
.plan__scope {
  margin-left: auto;
  @include fire-dim(14);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 内容区：设计稿 #140:25704 ===== */
.plan__body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: vw(12);
  /* 舞台要用容器查询算宽高：底图 contain 后的那块必须严格保持 1014:820，
     否则底图和按底图坐标摆的图元就对不上（max-height 收高度时宽不变，
     比例被拉扁，contain 会在盒子里再留边，图元全部错位）。 */
  container-type: size;
}

/* ===== 设备列表层：浮在平面图之上（设计稿 #160:25871） ===== */
/* 设计稿里它是平面图内容框内的绝对定位区块（x 12 / y 376 / 1477×450），
   盖住平面图下半部分 —— 平面图留上半部分当上下文，设备清单当下半部分的正文。
   展开高度由列表组件自己定（56% = 设计稿 450 / 796），折叠时只留 40 高的标题条，
   平面图整块露出来。 */
.plan__devices {
  position: absolute;
  left: vw(12);
  right: vw(12);
  bottom: vw(12);
  z-index: 10;
}

/* 舞台：底图实际落位的那块（1014×820），图元与底图共用同一坐标系 */
.plan__stage {
  position: relative;
  width: min(100cqw, calc(100cqh * 1014 / 820));
  aspect-ratio: 1014 / 820;
}

/* CAD 底图 */
.plan__base {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* ===== 设备点位 ===== */
.plan__point {
  position: absolute;
  aspect-ratio: 1;
  filter: drop-shadow(0 4px 10.5px rgba(0, 0, 0, 0.69));
}

.plan__point-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

/* 告警点位：设计稿给告警图元加了 2px 红描边；再加一圈呼吸光晕，远看也能一眼认出 */
.plan__point.is-alarmed {
  animation: plan-alarm 2s ease-in-out infinite;
}

.plan__point.is-alarmed .plan__point-img {
  outline: 2px solid var(--fire-anomaly);
  outline-offset: 1px;
  border-radius: vw(4);
}

/* 告警类别角标：档位由文案承担，颜色全页只留一个红 */
.plan__point-tag {
  position: absolute;
  top: -18%;
  left: 50%;
  transform: translateX(-50%);
  padding: 0 vw(4);
  border-radius: vw(2);
  background: var(--fire-anomaly);
  color: #06203f;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(13px * var(--min-scale)), 13px);
  line-height: 1.5;
  white-space: nowrap;
}

/* 定位态：设备列表点「定位」后，平面图上那一点的描边
   用选中蓝（#63A9FF，与树选中态同一色），不占用异常红 */
.plan__point.is-located .plan__point-img {
  outline: 2px solid #63a9ff;
  outline-offset: 2px;
  border-radius: vw(4);
  animation: plan-locate 1.2s ease-in-out infinite;
}

/* 定位标签：浮在设备列表层之上（列表盖住了图下半部分，
   没有这枚标签，「定位」这一下在图上就看不见了） */
.plan__locate {
  position: absolute;
  z-index: 30;
  transform: translate(-50%, calc(-100% - vw(10)));
  display: inline-flex;
  align-items: center;
  gap: vw(6);
  max-width: vw(280);
  padding: vh(4) vw(10);
  border: 1px solid rgba(99, 169, 255, 0.85);
  border-radius: vw(4);
  background: rgba(0, 32, 71, 0.96);
  color: var(--fire-text-hero);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14px * var(--min-scale)), 14px);
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 vh(4) vh(14) rgba(0, 10, 30, 0.5);
}

.plan__locate-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan__locate-cat {
  flex-shrink: 0;
  padding: 0 vw(6);
  border-radius: vw(2);
  background: var(--fire-anomaly);
  color: #06203f;
  font-size: clamp(12px, calc(13px * var(--min-scale)), 13px);
}

/* 空态 */
.plan__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  @include fire-dim(14);
}

@keyframes plan-alarm {
  0%,
  100% {
    filter: drop-shadow(0 4px 10.5px rgba(0, 0, 0, 0.69));
  }
  50% {
    filter: drop-shadow(0 4px 10.5px rgba(0, 0, 0, 0.69))
      drop-shadow(0 0 10px rgba(255, 128, 128, 0.85));
  }
}

/* 定位态呼吸：选中蓝，不是异常 */
@keyframes plan-locate {
  0%,
  100% {
    outline-color: rgba(99, 169, 255, 0.95);
  }
  50% {
    outline-color: rgba(99, 169, 255, 0.35);
  }
}
</style>
