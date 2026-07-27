<template>
  <div style="font-family:'Noto Sans SC','Outfit',-apple-system,sans-serif;min-height:100vh;background:#fafafa;">
    <!-- Hero -->
    <section class="ind-hero" style="background: linear-gradient(160deg, #7c2d12, #9a3412);">
      <div class="ind-hero-grid"></div>
      <div class="ind-hero-content">
        <a href="/portal" class="ind-back" style="color:rgba(255,255,255,.55);"><ChevronLeft :size="16" />场景总览</a>
        <h1 class="ind-hero-title">动火作业管理</h1>
        <p class="ind-hero-sub" style="color:rgba(255,255,255,.55);">一次动火，十五道关 —— 把侥幸关在制度笼子里。跨行业共享，适用于工贸企业和校园。</p>
      </div>
    </section>

    <!-- Industries -->
    <section style="padding: 64px 0;">
      <div class="ind-sec-wrap">
        <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.15em;margin-bottom:16px;font-family:'Outfit','Noto Sans SC',sans-serif;color:#d97706;">适用行业</div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;">
          <div class="hw-card" @click="$router.push('/portal/industry')">
            <div class="hw-card-icon"><Zap :size="20" color="#3678E3" /></div>
            <h3 class="hw-card-title">工贸企业</h3>
            <p class="hw-card-desc">管道焊接、设备改造、产线维修 —— 15 步审批防无证上岗、防事后补票。</p>
            <span class="hw-card-link">查看工贸场景<ArrowRight :size="12" /></span>
          </div>
          <div class="hw-card" @click="$router.push('/portal/campus')">
            <div class="hw-card-icon"><Building2 :size="20" color="#3678E3" /></div>
            <h3 class="hw-card-title">校园</h3>
            <p class="hw-card-desc">食堂后厨电焊维修、实验室改造、操场施工 —— 同一个 15 步流程，同一份合规报告。</p>
            <span class="hw-card-link">查看校园场景<ArrowRight :size="12" /></span>
          </div>
        </div>
      </div>
    </section>

    <!-- Process -->
    <section style="padding: 0 0 64px;">
      <div class="ind-sec-wrap">
        <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.15em;margin-bottom:16px;font-family:'Outfit','Noto Sans SC',sans-serif;color:#d97706;">15 步 × 4 阶段</div>
        <div class="hw-steps">
          <div v-for="(s,i) in stages" :key="s.name" class="hw-step-stage">
            <div class="hw-step-num">{{ i + 1 }}</div>
            <div class="hw-step-name">{{ s.name }}</div>
            <div class="hw-step-items">{{ s.steps }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="ind-cta">
      <a href="#" class="ind-cta-demo">预约演示<ArrowRight :size="14" /></a>
      <a href="/portal" class="ind-cta-btn">← 返回场景总览</a>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ArrowRight, Zap, Building2 } from 'lucide-vue-next'
const stages = [
  { name: '发起部署', steps: '作业发起、车间主体部署' },
  { name: '准备准入', steps: '证照备案、技术交底、环护方案、监火承诺、应急预案、安全员审核' },
  { name: '授权作业', steps: '签动作业票、现场会商、自律书、指令下达、现场实录' },
  { name: '闭环归档', steps: '清理交接、关闭动火票、30 分钟观察期' },
]
</script>

<style>
@import './IndustryShared.css';
</style>

<style scoped>
/* ===== HotWork overrides ===== */
.hw-card { background:#fff;border:1px solid rgba(54,120,227,.08);border-radius:12px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,.04);cursor:pointer;transition:all .3s; }
.hw-card:hover { transform:translateY(-4px);box-shadow:0 12px 40px rgba(54,120,227,.08); }
.hw-card-icon { width:40px;height:40px;border-radius:8px;background:rgba(54,120,227,.06);display:flex;align-items:center;justify-content:center;margin-bottom:16px; }
.hw-card-title { font-size:16px;font-weight:700;color:#101010;font-family:'Outfit','Noto Sans SC',sans-serif;margin:0 0 8px; }
.hw-card-desc { font-size:16px;color:#5e5e5e;line-height:1.65;margin:0 0 16px; }
.hw-card-link { font-size:16px;font-weight:600;color:#3678E3;display:inline-flex;align-items:center;gap:4px; }
.hw-steps { display:grid;grid-template-columns:repeat(4,1fr);gap:16px; }
@media (max-width:768px) { .hw-steps { grid-template-columns:repeat(2,1fr); } }
.hw-step-stage { background:#fff;border:1px solid rgba(217,119,6,.12);border-radius:12px;padding:24px;text-align:center; }
.hw-step-num { width:32px;height:32px;border-radius:50%;background:rgba(217,119,6,.08);color:#d97706;display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;font-family:'Outfit','Noto Sans SC',sans-serif;margin-bottom:12px; }
.hw-step-name { font-size:15px;font-weight:700;color:#101010;font-family:'Outfit','Noto Sans SC',sans-serif;margin-bottom:8px; }
.hw-step-items { font-size:16px;color:#5e5e5e;line-height:1.6; }
</style>
