<template>
  <div class="login-page">
    <div class="login-layout">
      <!-- 左侧：品牌形象区 -->
      <div class="login-hero">
        <div class="hero-illustration" aria-hidden="true">
          <!-- 装饰圆环 -->
          <div class="illu-ring illu-ring--1"></div>
          <div class="illu-ring illu-ring--2"></div>
          <div class="illu-ring illu-ring--3"></div>
          <!-- 柱状图装饰 -->
          <div class="illu-chart">
            <div class="illu-chart__bar" style="height:45%"></div>
            <div class="illu-chart__bar" style="height:72%"></div>
            <div class="illu-chart__bar" style="height:58%"></div>
            <div class="illu-chart__bar" style="height:88%"></div>
            <div class="illu-chart__bar" style="height:35%"></div>
            <div class="illu-chart__bar" style="height:65%"></div>
          </div>
          <!-- 数据卡片装饰 -->
          <div class="illu-dashboard">
            <div class="illu-dashboard__gauge">
              <svg viewBox="0 0 80 80" class="gauge-svg">
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(54,120,227,0.12)" stroke-width="6"/>
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(54,120,227,0.5)" stroke-width="6"
                  stroke-dasharray="160 200" stroke-linecap="round" transform="rotate(-90 40 40)"/>
              </svg>
              <span class="gauge-value">82<small>%</small></span>
            </div>
            <div class="illu-dashboard__dots">
              <span class="dot"></span>
              <span class="dot is-active"></span>
              <span class="dot"></span>
            </div>
          </div>
        </div>
        <div class="hero-text">
          <div class="hero-logo">
            <svg viewBox="0 0 40 40" fill="none">
              <rect x="4" y="16" width="5" height="20" rx="1.5" fill="currentColor" opacity="0.4"/>
              <rect x="11" y="10" width="5" height="26" rx="1.5" fill="currentColor" opacity="0.55"/>
              <rect x="18" y="3" width="5" height="33" rx="1.5" fill="currentColor" opacity="0.75"/>
              <rect x="25" y="13" width="5" height="23" rx="1.5" fill="currentColor" opacity="0.55"/>
              <rect x="32" y="19" width="5" height="17" rx="1.5" fill="currentColor" opacity="0.4"/>
            </svg>
          </div>
          <h1 class="hero-title">维保安全管理平台</h1>
          <p class="hero-desc">覆盖设备维护、安全履责、风险感知的一站式数字化管理</p>
        </div>
      </div>

      <!-- 右侧：登录卡片 -->
      <div class="login-form-area">
        <div class="login-card">
          <h2 class="card-title">账号登录</h2>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="0"
            size="large"
            @submit.prevent="handleLogin"
          >
            <el-form-item prop="phone">
              <el-input
                v-model="form.phone"
                placeholder="请输入手机号"
                :prefix-icon="Phone"
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
                :prefix-icon="Lock"
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
                {{ loading ? '登录中...' : '登 录' }}
              </el-button>
            </el-form-item>
          </el-form>

          <p class="login-error" v-if="errorMsg">{{ errorMsg }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Phone, Lock } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { loginApi } from '@/api/auth'

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
   登录页 — 严格参照火山引擎 console 设计
   ============================================ */

/* ---------- 满屏渐变背景 ---------- */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f0fe 0%, #f0f4fb 30%, #f5f7fc 50%, #f8f9fb 70%, #fafbfc 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
}

/* ---------- 居中布局容器（参照火山引擎 .layoutNew） ---------- */
.login-layout {
  display: flex;
  width: 100%;
  max-width: 1280px;
  min-height: 720px;
  align-items: stretch;
}

/* ============================================
   左侧：品牌形象区（参照 .leftBanner）
   flex:1 占满剩余空间
   ============================================ */
.login-hero {
  flex: 1 1 0%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 60px 40px;
}

/* —— 插图装饰层 —— */
.hero-illustration {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* 圆环 */
.illu-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(54, 120, 227, 0.1);
}
.illu-ring--1 {
  width: 500px; height: 500px;
  top: -140px; right: -100px;
}
.illu-ring--2 {
  width: 380px; height: 380px;
  bottom: -120px; left: -60px;
  border-color: rgba(54, 120, 227, 0.07);
}
.illu-ring--3 {
  width: 220px; height: 220px;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  border-color: rgba(54, 120, 227, 0.05);
  border-style: dashed;
}

/* 柱状图 */
.illu-chart {
  position: absolute;
  bottom: 28%;
  left: 15%;
  display: flex;
  align-items: flex-end;
  gap: 5px;
  width: 140px;
  height: 90px;
}
.illu-chart__bar {
  flex: 1;
  border-radius: 3px 3px 0 0;
  background: linear-gradient(180deg, rgba(54,120,227,0.45) 0%, rgba(54,120,227,0.1) 100%);
}

/* 仪表盘卡片 */
.illu-dashboard {
  position: absolute;
  top: 24%;
  right: 18%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.illu-dashboard__gauge {
  position: relative;
  width: 80px; height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.gauge-svg {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
}
.gauge-value {
  font-size: 22px;
  font-weight: 700;
  color: #3678E3;
  line-height: 1;
}
.gauge-value small {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.5;
}
.illu-dashboard__dots {
  display: flex;
  gap: 8px;
}
.illu-dashboard__dots .dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: rgba(54,120,227,0.18);
}
.illu-dashboard__dots .dot.is-active {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34,197,94,0.35);
}

/* —— 品牌文字 —— */
.hero-text {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 420px;
}
.hero-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px; height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #3678E3 0%, #5b8def 100%);
  color: #fff;
  margin-bottom: 24px;
  box-shadow: 0 6px 20px rgba(54, 120, 227, 0.22);
}
.hero-title {
  margin: 0 0 12px;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: 0.02em;
  line-height: 1.3;
}
.hero-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.65;
  color: #5f6b7a;
}

/* ============================================
   右侧：登录表单区（参照火山引擎右侧卡片）
   卡片: 480px, radius 20px, shadow 0-5-15, padding 48-43-32
   ============================================ */
.login-form-area {
  flex: 0 0 540px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-card {
  width: 476px;
  padding: 48px 43px 40px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.card-title {
  margin: 0 0 36px;
  font-size: 22px;
  font-weight: 600;
  color: #1d2129;
  letter-spacing: 0.02em;
}

/* —— 输入框：标准边框风格 —— */
.login-input :deep(.el-input__wrapper) {
  border: 1px solid #e5e6eb !important;
  border-radius: 4px !important;
  box-shadow: none !important;
  background: #fff !important;
  padding: 4px 12px !important;
  transition: border-color .2s;
}
.login-input :deep(.el-input__wrapper:hover) {
  border-color: #c9cdd4 !important;
}
.login-input :deep(.el-input__wrapper.is-focus) {
  border-color: #3678E3 !important;
  box-shadow: 0 0 0 2px rgba(54,120,227,0.1) !important;
}
.login-input :deep(.el-input__inner) {
  color: #1d2129 !important;
  font-size: 15px !important;
}
.login-input :deep(.el-input__inner::placeholder) {
  color: #c9cdd4 !important;
}
.login-input :deep(.el-input__prefix) {
  color: #a1a7b3;
  margin-right: 4px;
}

/* —— 按钮 —— */
.login-btn {
  width: 100%;
  height: 44px;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.05em;
  margin-top: 8px;
}

.login-error {
  margin: 20px 0 0;
  font-size: 13px;
  text-align: center;
  color: #DC2626;
}

/* ============================================
   响应式
   ============================================ */
@media (max-width: 900px) {
  .login-layout {
    flex-direction: column;
    min-height: auto;
  }

  .login-hero {
    flex: 0 0 auto;
    padding: 48px 24px 20px;
  }

  .hero-text {
    max-width: 100%;
  }

  .hero-logo {
    width: 44px; height: 44px;
    border-radius: 12px;
    margin-bottom: 18px;
  }

  .hero-title {
    font-size: 20px;
  }

  .hero-desc {
    font-size: 13px;
  }

  /* 隐藏装饰 */
  .hero-illustration { display: none; }

  .login-form-area {
    flex: 0 0 auto;
    padding: 0 20px 48px;
  }

  .login-card {
    width: 100%;
    max-width: 476px;
    padding: 32px 24px 28px;
  }
}
</style>
