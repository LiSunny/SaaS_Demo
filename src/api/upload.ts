/**
 * upload.ts — 文件上传 API 门面层
 *
 * 始终走 HTTP 真实 API，无 Mock 回退。
 */
export { uploadFile } from './adapters/upload-http'
