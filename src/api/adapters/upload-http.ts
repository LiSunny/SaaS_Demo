/**
 * upload-http.ts — 文件上传 HTTP Adapter
 */
import request from '@/utils/request'

/**
 * 上传文件到 OSS
 * @param file 要上传的文件对象
 * @param folder 存储目录分类，默认 "uploads"
 * @param onProgress 上传进度回调
 * @returns { url, key }
 */
export async function uploadFile(
  file: File,
  folder: string = 'uploads',
  onProgress?: (percent: number) => void,
): Promise<{ url: string; key: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const res = await request.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })

  return (res as any).data as { url: string; key: string }
}
