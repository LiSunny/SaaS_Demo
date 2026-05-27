import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    ElMessage.error(err.message || '请求失败')
    return Promise.reject(err)
  }
)

export default request
