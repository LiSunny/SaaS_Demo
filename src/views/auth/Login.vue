<template>
  <div class="login-page">
    <img class="bg-decoration" src="@/assets/land-bg.svg" alt="" aria-hidden="true" />

    <!-- 左上角：Logo + 品牌名 -->
    <header class="login-header">
      <div class="login-header-left">
        <img class="brand-logo" src="/favicon.svg" alt="平台logo" />
        <span class="brand-name">韧性云</span>
      </div>
      <a href="/portal" target="_blank" class="portal-entry">了解平台</a>
    </header>

    <!-- 中部：左右两栏 -->
    <div class="login-body">
      <!-- 左侧：品牌文案 + 功能卡片 -->
      <section class="hero-section">
        <div class="hero-text">
          <h1 class="hero-title">
            <span class="hero-title--accent">人工智能+ </span>
            <span class="hero-title--dark">公共安全管理平台</span>
          </h1>
          <p class="hero-subtitle">以AI观微知著 · 赋能韧性城市</p>
        </div>

        <div class="feature-grid">
          <div class="feature-card" v-for="card in featureCards" :key="card.title">
            <img class="feature-icon" :src="card.image" :alt="card.title" />
            <h3 class="feature-title">{{ card.title }}</h3>
            <p class="feature-desc">{{ card.desc }}</p>
          </div>
        </div>
      </section>

      <!-- 右侧：登录卡片 -->
      <div class="login-form-area">
        <div class="login-card">
          <h2 class="card-title">欢迎使用公共安全管理平台</h2>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="0"
            size="large"
            class="login-form"
            @submit.prevent="handleLogin"
          >
            <el-form-item prop="phone">
              <el-input
                v-model="form.phone"
                placeholder="请输入手机号"
                clearable
                maxlength="11"
                class="login-input"
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                show-password
                class="login-input"
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                class="login-btn"
                @click="handleLogin"
              >
                {{ loading ? '登录中...' : '开始体验' }}
              </el-button>
            </el-form-item>
          </el-form>

          <p class="login-error" v-if="errorMsg">{{ errorMsg }}</p>

          <!-- 体验账号区 -->
          <div class="demo-section">
            <p class="demo-label">体验账号</p>
            <div class="demo-grid">
              <div
                class="demo-card"
                v-for="account in demoAccounts"
                :key="account.role"
                @click="fillDemo(account)"
              >
                <img
                  :src="account.image"
                  :alt="account.role"
                  class="demo-illustration"
                />
                <span class="demo-role">{{ account.role }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部版权 -->
    <footer class="login-footer">
      <span>版权所有©️北京韧性科技2026</span>
      <span class="footer-divider">|</span>
      <a class="footer-icp" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">冀ICP备2026024061号-1</a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { loginApi } from '@/api/auth'
import platformAdminImg from '@/assets/demo-roles/platform-admin.svg'
import opsManagerImg from '@/assets/demo-roles/ops-manager.svg'
import enterpriseAdminImg from '@/assets/demo-roles/enterprise-admin.svg'
import normalUserImg from '@/assets/demo-roles/normal-user.svg'
import featureMonitor from '@/assets/demo-roles/feature-monitor.svg'
import featureHelmet from '@/assets/demo-roles/feature-helmet.svg'
import featureCycle from '@/assets/demo-roles/feature-cycle.svg'
import featureSlide from '@/assets/demo-roles/feature-slide.svg'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  phone: '',
  password: '',
})

const rules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

// 左侧功能卡片
const featureCards = [
  {
    image: featureMonitor,
    title: '智能监测预警',
    desc: '7×24 小时全域设备实时感知安全风险，依托 AI 智能研判告警，为应急处置提供科学决策支撑',
  },
  {
    image: featureHelmet,
    title: '安全履职管理',
    desc: '全流程数字化留存安全工作台账，标准化规范岗位操作，推动企业安全主体责任落地见效。',
  },
  {
    image: featureCycle,
    title: '隐患闭环治理',
    desc: '覆盖隐患上报、派发、整改、复查全流程，全程留痕追踪，实现安全隐患闭环管控。',
  },
  {
    image: featureSlide,
    title: '数据可视化分析',
    desc: '整合多维度安全运行数据，可视化大屏直观展示，全域安全整体态势清晰可察。',
  },
]

// 体验账号
const demoAccounts = [
  { role: '平台管理', phone: '17733550542', password: '3jzl8h', image: platformAdminImg },
  { role: '运营管理', phone: '13800000001', password: '3xkxr4', image: opsManagerImg },
  { role: '企业管理', phone: '13567890123', password: 'admin123!@#', image: enterpriseAdminImg },
  { role: '普通用户', phone: '13800000000', password: 'admin123!@#', image: normalUserImg },
]

function fillDemo(account: typeof demoAccounts[0]) {
  form.phone = account.phone
  form.password = account.password
  errorMsg.value = ''
  handleLogin()
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  errorMsg.value = ''

  try {
    const res = await loginApi({
      phone: form.phone,
      password: form.password,
    })

    userStore.setLogin(res.token, res.user)
    ElMessage.success('登录成功')

    const redirect = (route.query.redirect as string) || '/workbench'
    router.replace(redirect)
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || err?.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ============================================
   登录页 — Figma 设计稿还原 (1920×1080)
   窗口适配：CSS viewport-ratio scaling
   ============================================ */
.login-page {
  --dw: 1920;
  --dh: 1080;
  --w: calc(100vw / var(--dw));
  --h: calc(100vh / var(--dh));
  --min-scale: min(var(--w), var(--h));

  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f0f6fd 0%, #f8f2fb 55.62%, #f6f5fc 100%);
  overflow: hidden;
}

/* ---------- 背景装饰层 ---------- */
.bg-decoration {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

/* ============================================
   Header — Logo + 品牌名
   ============================================ */
.login-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(28 * var(--h)) calc(27 * var(--w)) 0 calc(27 * var(--w));
}

.login-header-left {
  display: flex;
  align-items: center;
  gap: calc(18 * var(--w));
}

.brand-logo {
  width: calc(60 * var(--min-scale));
  height: calc(60 * var(--min-scale));
  border-radius: calc(12 * var(--min-scale));
  flex-shrink: 0;
}

.brand-name {
  font-family: 'Alimama ShuHeiTi', 'PingFang SC', sans-serif;
  font-weight: 700;
  font-size: clamp(24px, calc(46 * var(--min-scale)), 46px);
  color: var(--text-secondary, #2e2e2e);
  white-space: nowrap;
  line-height: 1;
}

.portal-entry {
  font-size: calc(16 * var(--min-scale));
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
  flex-shrink: 0;
}
.portal-entry:hover { opacity: 0.75; }

/* ============================================
   中部：双栏布局
   ============================================ */
.login-body {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 calc(139 * var(--w)) 0 calc(215 * var(--w));
  min-height: 0;
}

/* ============================================
   左侧：品牌区
   ============================================ */
.hero-section {
  display: flex;
  flex-direction: column;
  gap: calc(48 * var(--h));
  padding-bottom: calc(87 * var(--h));
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: calc(24 * var(--h));
}

.hero-title {
  font-family: 'Source-KeynoteartHans', 'PingFang SC', sans-serif;
  font-weight: 400;
  font-size: clamp(22px, calc(46 * var(--min-scale)), 46px);
  line-height: 1.25;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0;
}

.hero-title--accent {
  color: #1c73ff;
  white-space: nowrap;
}

.hero-title--dark {
  color: var(--text-secondary, #2e2e2e);
  white-space: nowrap;
}

.hero-subtitle {
  font-size: clamp(16px, calc(24 * var(--min-scale)), 24px);
  color: var(--text-tertiary, #454545);
  margin: 0;
  line-height: 1.4;
}

/* ---------- 功能卡片 2x2 ---------- */
.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(24 * var(--w));
  width: calc(694 * var(--w));
}

.feature-card {
  background: rgba(255, 255, 255, 0.6);
  border-radius: calc(14 * var(--min-scale));
  padding: calc(16 * var(--min-scale));
  display: flex;
  flex-direction: column;
  gap: calc(12 * var(--min-scale));
  min-height: calc(194 * var(--h));
}

.feature-icon {
  width: calc(28 * var(--min-scale));
  height: calc(28 * var(--min-scale));
  flex-shrink: 0;
  display: block;
}

.feature-title {
  font-size: clamp(14px, calc(20 * var(--min-scale)), 20px);
  font-weight: 500;
  color: var(--text-tertiary, #454545);
  margin: 0;
  line-height: 1.3;
}

.feature-desc {
  font-size: clamp(13px, calc(18 * var(--min-scale)), 18px);
  color: var(--text-muted, #5e5e5e);
  margin: 0;
  line-height: 1.5;
  flex: 1;
}

/* ============================================
   右侧：登录卡片
   ============================================ */
.login-form-area {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.login-card {
  width: 32vw;
  min-width: 380px;
  max-width: 520px;
  padding: calc(48 * var(--min-scale));
  background: var(--bg-card, #ffffff);
  border-radius: calc(14 * var(--min-scale));
  box-shadow: 0 0 calc(2 * var(--min-scale)) rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: calc(24 * var(--min-scale));
}

.card-title {
  font-size: clamp(16px, calc(24 * var(--min-scale)), 24px);
  font-weight: 500;
  color: var(--text-secondary, #2e2e2e);
  margin: 0;
  line-height: 1.3;
}

/* ---------- 表单 ---------- */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.login-form :deep(.el-form-item) {
  margin-bottom: calc(16 * var(--min-scale));
}

.login-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

/* 输入框 */
.login-input :deep(.el-input__wrapper) {
  height: calc(58 * var(--h));
  border: 1px solid var(--border-high, #d3d3d3) !important;
  border-radius: calc(8 * var(--min-scale)) !important;
  box-shadow: none !important;
  background: var(--bg-card, #fff) !important;
  padding: 0 calc(16 * var(--w)) !important;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.login-input :deep(.el-input__wrapper:hover) {
  border-color: var(--accent-primary, #3678e3) !important;
}

.login-input :deep(.el-input__wrapper.is-focus) {
  border-color: var(--accent-primary, #3678e3) !important;
  box-shadow: 0 0 0 calc(2 * var(--min-scale)) rgba(54, 120, 227, 0.1) !important;
}

.login-input :deep(.el-input__inner) {
  color: var(--text-primary, #101010) !important;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px) !important;
}

/* 消除浏览器自动填充的淡蓝色背景 */
.login-input :deep(.el-input__inner:-webkit-autofill),
.login-input :deep(.el-input__inner:-webkit-autofill:hover),
.login-input :deep(.el-input__inner:-webkit-autofill:focus) {
  -webkit-box-shadow: 0 0 0 1000px var(--bg-card, #fff) inset !important;
  -webkit-text-fill-color: var(--text-primary, #101010) !important;
  transition: background-color 5000s ease-in-out 0s;
}

.login-input :deep(.el-input__inner::placeholder) {
  color: var(--text-placeholder, #d9d9d9) !important;
}

.login-input :deep(.el-input__clear) {
  color: var(--text-muted, #5e5e5e);
}

.login-input :deep(.el-input__suffix) {
  color: var(--text-muted, #5e5e5e);
}

/* 按钮 */
.login-btn {
  width: 100%;
  height: calc(58 * var(--h));
  border-radius: calc(8 * var(--min-scale));
  font-size: clamp(14px, calc(16 * var(--min-scale)), 18px);
  font-weight: 500;
  margin-top: 0;
  --el-button-bg-color: var(--accent-primary, #3678E3);
  --el-button-border-color: var(--accent-primary, #3678E3);
  --el-button-hover-bg-color: var(--accent-dark, #204785);
  --el-button-hover-border-color: var(--accent-dark, #204785);
  --el-button-text-color: #fff;
}

.login-error {
  margin: 0;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 12px);
  text-align: center;
  color: var(--danger, #dc2626);
}

/* ============================================
   体验账号
   ============================================ */
.demo-section {
  display: flex;
  flex-direction: column;
  gap: calc(10 * var(--min-scale));
}

.demo-label {
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
  color: var(--text-tertiary, #454545);
  margin: 0;
  line-height: 1;
  white-space: nowrap;
}

.demo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(12 * var(--w));
}

.demo-card {
  background: var(--bg-sub-card, #fbfbfb);
  border: 1px solid var(--border-default, #dedede);
  border-radius: calc(8 * var(--min-scale));
  padding: calc(12 * var(--min-scale));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(6 * var(--min-scale));
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.demo-card:hover {
  border-color: var(--accent-primary, #3678e3);
  box-shadow: 0 0 0 calc(2 * var(--min-scale)) rgba(54, 120, 227, 0.1);
}

.demo-illustration {
  height: calc(72 * var(--h));
  width: auto;
  object-fit: contain;
}

.demo-role {
  font-size: clamp(12px, calc(14 * var(--min-scale)), 14px);
  color: var(--text-muted, #5e5e5e);
  white-space: nowrap;
}

/* ============================================
   Footer
   ============================================ */
.login-footer {
  position: relative;
  text-align: center;
  font-size: clamp(13px, calc(16 * var(--min-scale)), 16px);
  color: var(--text-tertiary, #454545);
  padding-bottom: calc(32 * var(--h));
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(6 * var(--w));
  white-space: nowrap;
}

.footer-divider {
  color: var(--text-muted, #5e5e5e);
}

.footer-icp {
  color: var(--text-tertiary, #454545);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s;
}

.footer-icp:hover {
  color: var(--accent-primary, #3678E3);
}
</style>
