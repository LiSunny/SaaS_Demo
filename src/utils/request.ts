import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 请求拦截：自动带 Bearer token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：统一解包 + 401 处理
request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      // token 过期 → 清除登录态，跳转登录页
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      // 不在这里跳转，由路由守卫统一处理
    }
    ElMessage.error(err.response?.data?.message || err.message || '请求失败')
    return Promise.reject(err)
  },
)

export default request
