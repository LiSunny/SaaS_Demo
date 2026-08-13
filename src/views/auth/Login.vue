<template>
  <div class="login-page">
    <img class="bg-decoration" src="@/assets/land-bg.svg" alt="" aria-hidden="true" />

    <!-- 左上角：Logo + 品牌名 -->
    <header class="login-header">
      <div class="login-header-left">
        <img class="brand-logo" src="/favicon.svg" alt="平台logo" />
        <span class="brand-name">公共安全管理平台</span>
      </div>
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

          <!-- 登录方式切换 -->
          <div class="login-mode-tabs">
            <button
              class="mode-tab"
              :class="{ active: loginMode === 'password' }"
              type="button"
              @click="switchMode('password')"
            >密码登录</button>
            <button
              class="mode-tab"
              :class="{ active: loginMode === 'sms' }"
              type="button"
              @click="switchMode('sms')"
            >验证码登录</button>
          </div>

          <el-form
            ref="formRef"
            :model="form"
            :rules="currentRules"
            label-width="0"
            size="large"
            class="login-form"
            @submit.prevent="handleLogin"
          >
            <el-form-item prop="phone">
              <el-input
                v-model="form.phone"
                placeholder="请输入手机号"
                autocomplete="username"
                aria-label="手机号"
                clearable
                maxlength="11"
                class="login-input"
              />
            </el-form-item>

            <!-- 密码登录：密码框 -->
            <template v-if="loginMode === 'password'">
              <el-form-item prop="password">
                <el-input
                  v-model="form.password"
                  type="password"
                  placeholder="请输入密码"
                  autocomplete="current-password"
                  aria-label="密码"
                  show-password
                  class="login-input"
                  @keyup.enter="handleLogin"
                />
              </el-form-item>
            </template>

            <!-- 验证码登录：验证码输入 + 发送按钮 -->
            <template v-if="loginMode === 'sms'">
              <el-form-item prop="smsCode">
                <div class="sms-code-row">
                  <el-input
                    v-model="form.smsCode"
                    placeholder="请输入短信验证码"
                    autocomplete="one-time-code"
                    aria-label="短信验证码"
                    maxlength="6"
                    class="login-input sms-code-input"
                    @keyup.enter="handleLogin"
                  />
                  <el-button
                    class="sms-send-btn"
                    :disabled="codeSending || countdown > 0"
                    @click="sendSmsCode"
                  >
                    {{ countdown > 0 ? `${countdown}s 后重发` : codeSending ? '发送中...' : '获取验证码' }}
                  </el-button>
                </div>
              </el-form-item>
            </template>

            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                class="login-btn"
                @click="handleLogin"
              >
                {{ loading ? '登录中...' : '登录' }}
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 忘记密码 + 协议 -->
          <div class="form-footer-row">

            <label class="agreement-check">
              <input type="checkbox" v-model="agreed" />
              <span class="agreement-check-text">
                同意<a href="/portal" target="_blank">《用户协议》</a>和<a href="/portal" target="_blank">《隐私政策》</a>
              </span>
            </label>
            <a
              v-if="loginMode === 'password'"
              class="forgot-link-inline"
              href="javascript:void(0)"
              @click="handleForgotPassword"
            >忘记密码？</a>
            <span v-else></span>
            
          </div>

          <p class="login-error" v-if="errorMsg">{{ errorMsg }}</p>

          <!-- 体验账号区分隔 -->
          <div class="demo-divider">
            <span class="demo-divider-text">选择角色 · 一键登录</span>
          </div>

          <!-- 体验账号区（四方用户视角） -->
          <div class="demo-section">
            <div class="demo-rows">
              <div class="demo-row">
                <div
                  class="demo-card"
                  v-for="account in demoRow1"
                  :key="account.role"
                  @click="fillDemo(account)"
                >
                  <img
                    :src="account.image"
                    :alt="account.role"
                    class="demo-illustration"
                  />
                  <span class="demo-role">{{ account.role }}</span>
                  <span class="demo-desc">{{ account.desc }}</span>
                </div>
              </div>
              <div class="demo-row">
                <div
                  class="demo-card"
                  v-for="account in demoRow2"
                  :key="account.role"
                  @click="fillDemo(account)"
                >
                  <img
                    :src="account.image"
                    :alt="account.role"
                    class="demo-illustration"
                  />
                  <span class="demo-role">{{ account.role }}</span>
                  <span class="demo-desc">{{ account.desc }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部版权 -->
    <footer class="login-footer">
      <a href="/portal" target="_blank" class="footer-portal">关于公共安全管理平台</a>
      <div class="footer-copyright">
        <span>版权所有©️北京韧性科技2026</span>
        <span class="footer-divider">|</span>
        <a class="footer-icp" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">冀ICP备2026024061号-1</a>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { loginApi } from '@/api/auth'
import { getUserDefaultBigscreen } from '@/api/bigscreen'
import { getBigscreenRoute } from '@/config/bigscreen-templates'
import platformAdminImg from '@/assets/demo-roles/platform-admin.svg'
import opsManagerImg from '@/assets/demo-roles/ops-manager.svg'
import supervisionAdminImg from '@/assets/demo-roles/supervision-admin.svg'
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
const agreed = ref(true)

// 登录方式
const loginMode = ref<'password' | 'sms'>('password')
const codeSending = ref(false)
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  phone: '',
  password: '',
  smsCode: '',
})

const rules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  smsCode: [
    { required: true, message: '请输入短信验证码', trigger: 'blur' },
    { pattern: /^\d{4,6}$/, message: '验证码为4-6位数字', trigger: 'blur' },
  ],
}

// 根据登录方式动态切换校验规则
const currentRules = computed<FormRules>(() => {
  if (loginMode.value === 'sms') {
    return {
      phone: rules.phone,
      smsCode: rules.smsCode,
    }
  }
  return {
    phone: rules.phone,
    password: rules.password,
  }
})

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

// 体验账号 — 四方用户视角（与导航分组对齐），根据打包环境自动切换
// 监管机构：海港应急局 13000000001 admin123!@# → 区域监管
// 社会单位：新思维中学 13100001234 admin123!@# → 安全管理
// 运营商：  安信智慧消防 18800001234 admin123!@# → 项目管理
// 服务机构：蓝盾消防 13900002222 admin123!@# → 技术服务
// 平台方：  测试运营(platform-ops) 13800000001 3xkxr4 → 运营管理
const demoAccounts = import.meta.env.PROD
  ? [
      { role: '监管机构', desc: '区域监管 · 联勤督办', phone: '13000000001', password: 'admin123!@#', image: supervisionAdminImg },
      { role: '社会单位', desc: '自查自管 · 隐患闭环', phone: '13100001234', password: 'admin123!@#', image: platformAdminImg },
      { role: '运营管理', desc: '安全托管 · 项目服务', phone: '18800001234', password: 'admin123!@#', image: opsManagerImg },
      { role: '服务机构', desc: '维保检测 · 接单处置', phone: '13900002222', password: 'admin123!@#', image: enterpriseAdminImg },
      { role: '平台管理', desc: '租户开通 · 配置支撑', phone: '13800000001', password: '3xkxr4', image: normalUserImg },
    ]
  : [
      { role: '监管机构', desc: '区域监管 · 联勤督办', phone: '13000000001', password: 'admin123!@#', image: supervisionAdminImg },
      { role: '社会单位', desc: '自查自管 · 隐患闭环', phone: '13100001234', password: 'admin123!@#', image: platformAdminImg },
      { role: '运营管理', desc: '安全托管 · 项目服务', phone: '18800001234', password: 'admin123!@#', image: opsManagerImg },
      { role: '服务机构', desc: '维保检测 · 接单处置', phone: '13900002222', password: 'admin123!@#', image: enterpriseAdminImg },
      { role: '平台管理', desc: '租户开通 · 配置支撑', phone: '13800000001', password: '3xkxr4', image: normalUserImg },
    ]

// 5 个账号拆为两行：第一行 3 个、第二行 2 个
const demoRow1 = demoAccounts.slice(0, 3)
const demoRow2 = demoAccounts.slice(3)

function fillDemo(account: typeof demoAccounts[0]) {
  form.phone = account.phone
  form.password = account.password
  errorMsg.value = ''
  handleLogin()
}

function handleForgotPassword() {
  ElMessage.info('请联系系统管理员重置密码')
}

// 切换登录方式
function switchMode(mode: 'password' | 'sms') {
  if (loginMode.value === mode) return
  loginMode.value = mode
  form.password = ''
  form.smsCode = ''
  errorMsg.value = ''
  formRef.value?.clearValidate()
}

// 发送短信验证码
function sendSmsCode() {
  // 先校验手机号
  const phoneValid = /^1[3-9]\d{9}$/.test(form.phone)
  if (!phoneValid) {
    ElMessage.warning('请先输入正确的手机号')
    return
  }
  codeSending.value = true
  // 模拟发送
  setTimeout(() => {
    codeSending.value = false
    countdown.value = 60
    ElMessage.success('验证码已发送')
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        if (countdownTimer) clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  }, 800)
}

// 案例详情页"去体验" → URL参数自动填充并登录
onMounted(async () => {
  const phone = route.query.phone as string
  const pwd = route.query.password as string
  if (phone && pwd) {
    form.phone = phone
    form.password = pwd
    errorMsg.value = ''
    await nextTick()
    handleLogin()
  }
})

async function handleLogin() {
  if (!agreed.value) {
    ElMessage.warning('请先阅读并同意用户协议和隐私政策')
    return
  }
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  errorMsg.value = ''

  try {
    // 验证码模式：目前暂用密码接口，后续替换为短信登录接口
    const res = await loginApi({
      phone: form.phone,
      password: loginMode.value === 'sms' ? form.smsCode : form.password,
    })

    userStore.setLogin(res.token, res.user)
    ElMessage.success('登录成功')

    // 1. 系统角色 → redirect 优先，兜底工作台
    if (res.user.systemRole) {
      const redirect = route.query.redirect as string
      if (redirect && redirect !== '/login') {
        router.replace(redirect)
      } else {
        router.replace('/workbench')
      }
      return
    }

    // 2. 企业用户 → 查默认大屏（优先级高于 redirect）
    try {
      const defaultScreen = await getUserDefaultBigscreen()
      if (defaultScreen) {
        router.replace(getBigscreenRoute(defaultScreen.type, defaultScreen.id))
        return
      }
    } catch { /* 静默降级 */ }

    // 3. 企业用户无大屏 → redirect 次之（排除 /，避免无限循环）
    const redirect = route.query.redirect as string
    if (redirect && redirect !== '/login' && redirect !== '/') {
      router.replace(redirect)
      return
    }

    // 4. 兜底 → 工作台
    router.replace('/workbench')
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
  width: calc(48 * var(--min-scale));
  height: calc(48 * var(--min-scale));
  border-radius: calc(12 * var(--min-scale));
  flex-shrink: 0;
}

.brand-name {
  font-family: 'Alimama ShuHeiTi', 'PingFang SC', sans-serif;
  font-weight: 700;
  font-size: clamp(18px, calc(22 * var(--min-scale)), 26px);
  color: var(--text-secondary, #2e2e2e);
  white-space: nowrap;
  line-height: 1;
}

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
  font-weight: 500;
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
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: calc(14 * var(--min-scale));
  padding: calc(16 * var(--min-scale));
  display: flex;
  flex-direction: column;
  gap: calc(12 * var(--min-scale));
  min-height: calc(194 * var(--h));
  box-shadow: 0 4px 24px rgba(31, 38, 135, 0.08);
  transition: background 0.25s, border-color 0.25s, box-shadow 0.25s;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.32);
  border-color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 6px 32px rgba(31, 38, 135, 0.12);
}

.feature-icon {
  width: calc(28 * var(--min-scale));
  height: calc(28 * var(--min-scale));
  flex-shrink: 0;
  display: block;
}

.feature-title {
  font-size: clamp(14px, calc(18 * var(--min-scale)), 20px);
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
  font-size: clamp(28px, calc(32 * var(--min-scale)), 38px);
  font-weight: 800;
  color: var(--text-secondary, #2e2e2e);
  margin: 0;
  line-height: 1.3;
}

/* ---------- 登录方式切换 Tab ---------- */
.login-mode-tabs {
  display: flex;
  gap: 0;
  background: var(--bg-sub-card, #f5f5f5);
  border-radius: calc(8 * var(--min-scale));
  padding: calc(4 * var(--min-scale));
}

.mode-tab {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-muted, #5e5e5e);
  font-size: clamp(13px, calc(14 * var(--min-scale)), 14px);
  padding: calc(8 * var(--min-scale)) 0;
  border-radius: calc(6 * var(--min-scale));
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  font-family: inherit;
}

.mode-tab.active {
  background: #fff;
  color: var(--text-secondary, #2e2e2e);
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* ---------- 短信验证码行 ---------- */
.sms-code-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: calc(12 * var(--w));
  align-items: center;
  width: 100%;
}

.sms-code-input {
  min-width: 0;
}

.sms-send-btn {
  min-width: 0;
  height: calc(58 * var(--h));
  border-radius: calc(8 * var(--min-scale));
  font-size: clamp(12px, calc(14 * var(--min-scale)), 14px);
  white-space: nowrap;
  padding: 0 calc(16 * var(--w));
  --el-button-bg-color: var(--accent-primary, #3678E3);
  --el-button-border-color: var(--accent-primary, #3678E3);
  --el-button-text-color: #fff;
  --el-button-disabled-bg-color: #d9d9d9;
  --el-button-disabled-border-color: #d9d9d9;
  --el-button-disabled-text-color: #999;
}

/* ---------- 体验账号分隔 ---------- */
.demo-divider {
  display: flex;
  align-items: center;
  gap: calc(12 * var(--w));
}

.demo-divider::before,
.demo-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-default, #dedede);
}

.demo-divider-text {
  font-size: clamp(12px, calc(13 * var(--min-scale)), 13px);
  color: var(--text-muted, #5e5e5e);
  white-space: nowrap;
}

/* ---------- 表单 ---------- */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.login-form :deep(.el-form-item) {
  margin-bottom: calc(14 * var(--min-scale));
  position: relative;
  padding-bottom: calc(9 * var(--min-scale));
}

.login-form :deep(.el-form-item.is-error) {
  margin-bottom: calc(9 * var(--min-scale));
}

.login-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
  padding-bottom: 0;
  margin-top: calc(23 * var(--min-scale));
}

/* 表单验证错误信息 */
.login-form :deep(.el-form-item__error) {
  position: absolute;
  bottom: 0;
  left: 0;
  font-size: calc(14 * var(--min-scale));
  line-height: calc(18 * var(--min-scale));
  padding-top: calc(6 * var(--min-scale));
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
  overflow: hidden;
}

.login-input :deep(.el-input__wrapper:hover) {
  border-color: var(--accent-primary, #3678e3) !important;
}

.login-input :deep(.el-input__wrapper.is-focus) {
  border-color: var(--accent-primary, #3678e3) !important;
  box-shadow: 0 0 0 calc(2 * var(--min-scale)) rgba(54, 120, 227, 0.1) !important;
}

.login-input :deep(.el-input__inner) {
  height: 100%;
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

/* 表单底部：忘记密码 + 协议 */
.form-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(8 * var(--w));
}

.forgot-link-inline {
  font-size: clamp(13px, calc(14 * var(--min-scale)), 14px);
  color: var(--accent-primary, #3678e3);
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.2s;
  flex-shrink: 0;
  min-width: 0;
}

.forgot-link-inline:hover {
  opacity: 0.75;
}

.agreement-check {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: calc(6 * var(--w));
  cursor: pointer;
  flex-shrink: 0;
}

.agreement-check input[type="checkbox"] {
  width: calc(16 * var(--min-scale));
  height: calc(16 * var(--min-scale));
  accent-color: var(--accent-primary, #3678e3);
  cursor: pointer;
  flex-shrink: 0;
  margin: 0;
}

.agreement-check-text {
  font-size: clamp(12px, calc(13 * var(--min-scale)), 13px);
  color: var(--text-muted, #5e5e5e);
  white-space: nowrap;
}

.agreement-check-text a {
  color: var(--accent-primary, #3678e3);
  text-decoration: none;
  transition: opacity 0.2s;
}

.agreement-check-text a:hover {
  opacity: 0.75;
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

.demo-rows {
  display: flex;
  flex-direction: column;
  gap: calc(12 * var(--min-scale));
}

.demo-row {
  display: flex;
  gap: calc(12 * var(--w));
}

.demo-row .demo-card {
  flex: 1 0 0;
  min-width: 0;
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
  font-size: clamp(14px, calc(16 * var(--min-scale)), 18px);
  color: var(--text-tertiary);
  white-space: nowrap;
}

.demo-desc {
  font-size: clamp(12px, calc(14 * var(--min-scale)), 14px);
  color: var(--text-muted);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

/* ============================================
   Footer
   ============================================ */
.login-footer {
  position: relative;
  text-align: center;
  padding-bottom: calc(32 * var(--h));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(8 * var(--min-scale));
}

.footer-portal {
  font-size: clamp(13px, calc(16 * var(--min-scale)), 16px);
  color: var(--accent-primary, #3678e3);
  text-decoration: none;
  transition: opacity 0.2s;
}
.footer-portal:hover { opacity: 0.75; }

.footer-copyright {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(6 * var(--w));
  font-size: clamp(13px, calc(16 * var(--min-scale)), 16px);
  color: var(--text-tertiary, #454545);
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
