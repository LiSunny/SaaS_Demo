import { ElMessageBox } from 'element-plus'
import type { ElMessageBoxOptions, Action } from 'element-plus'

/**
 * 通用确认弹窗 — 封装 ElMessageBox，对齐设计令牌语义色。
 *
 * 设计令牌映射：
 * - 删除/破坏性操作 → type: 'error'（--danger: #DC2626）
 * - 停用/切换/提醒   → type: 'warning'（--warning: #D97706）
 * - 成功提示         → type: 'success'（--success: #059669）
 */
export function useConfirm() {
  // ==================== 破坏性操作（error） ====================

  /**
   * 删除确认 — 消息格式：确认删除「{name}」？{extra}
   * @param name 被删除项名称
   * @param extra 额外提示文字（如 "删除后不可恢复。"），可选
   */
  async function confirmDelete(name: string, extra?: string): Promise<void> {
    const message = extra
      ? `确认删除 ${name} ？${extra}`
      : `确认删除 ${name} ？`
    await ElMessageBox.confirm(message, '删除确认', {
      type: 'error',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
    } as ElMessageBoxOptions)
  }

  /**
   * 删除确认（输入校验）— 用户必须录入正确的名称才能删除。
   * 提示文字：请输入「{name}」以确认删除。{extra}
   * @param name 需录入匹配的名称
   * @param extra 额外提示文字（如 "删除后不可恢复。"），可选
   */
  async function confirmDeleteWithInput(name: string, extra?: string): Promise<void> {
    const message = extra
      ? `请输入「${name}」以确认删除。${extra}`
      : `请输入「${name}」以确认删除。`
    // 转义正则特殊字符，确保精确匹配
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    await ElMessageBox.prompt(message, '删除确认', {
      type: 'error',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      inputPlaceholder: `请输入「${name}」`,
      inputPattern: new RegExp(`^${escaped}$`),
      inputErrorMessage: `输入不匹配，请输入「${name}」`,
    } as ElMessageBoxOptions)
  }

  /**
   * 批量删除确认
   * @param count 选中数量
   * @param label 项标签（如 "模板"、"计划"），可选
   */
  async function confirmBatchDelete(count: number, label = ''): Promise<void> {
    const suffix = label || '项'
    await ElMessageBox.confirm(
      `确认删除选中的 ${count} ${suffix}？`,
      '批量删除确认',
      {
        type: 'error',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      } as ElMessageBoxOptions,
    )
  }

  // ==================== 警示操作（warning） ====================

  /**
   * 离开/放弃编辑确认
   * @param message 提示消息，默认 "放弃已填写的内容？"
   * @param overrides 可选覆盖（如自定义按钮文案）
   */
  async function confirmLeave(
    message = '放弃已填写的内容？',
    overrides?: Partial<ElMessageBoxOptions>,
  ): Promise<void> {
    await ElMessageBox.confirm(message, '提示', {
      type: 'warning',
      ...overrides,
    } as ElMessageBoxOptions)
  }

  /**
   * 停用确认
   * @param name 被停用项名称
   */
  async function confirmDisable(name: string): Promise<void> {
    await ElMessageBox.confirm(
      `确定停用${name}吗？停用后所有企业均不可登录。`,
      '停用确认',
      { type: 'warning' } as ElMessageBoxOptions,
    )
  }

  /**
   * 状态切换确认（启用/停用、锁定/解锁）
   * @param name 操作对象名称
   * @param action 操作描述（如 "锁定"、"解锁"）
   */
  async function confirmToggle(name: string, action: string): Promise<void> {
    await ElMessageBox.confirm(`确认${action}「${name}」？`, '提示', {
      type: 'warning',
    } as ElMessageBoxOptions)
  }

  /**
   * 重置密码确认
   */
  async function confirmResetPwd(): Promise<void> {
    await ElMessageBox.confirm(
      '确定重置该用户的密码吗？重置后密码为随机生成的6位字符串。',
      '重置密码确认',
      { type: 'warning' } as ElMessageBoxOptions,
    )
  }

  /**
   * 退出登录确认
   */
  async function confirmLogout(): Promise<void> {
    await ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
      type: 'warning',
    } as ElMessageBoxOptions)
  }

  /**
   * 解除关联确认（单个）
   * @param name 关联方名称
   */
  async function confirmRemove(name: string): Promise<void> {
    await ElMessageBox.confirm(
      `确认解除与「${name}」的相关方关联？解除后该企业将无法访问你的数据。`,
      '解除确认',
      {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消',
      } as ElMessageBoxOptions,
    )
  }

  /**
   * 批量解除关联确认
   * @param names 关联方名称列表（已拼接为字符串）
   */
  async function confirmBatchRemove(names: string): Promise<void> {
    await ElMessageBox.confirm(
      `确认解除与「${names}」的相关方关联？解除后该企业将无法访问你的数据。`,
      '批量解除确认',
      {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消',
      } as ElMessageBoxOptions,
    )
  }

  // ==================== 成功提示（success） ====================

  /**
   * 成功提示弹窗（替代 ElMessageBox.alert）
   * @param message 消息内容（支持 HTML）
   * @param title 标题
   */
  async function showSuccessAlert(
    message: string,
    title: string,
    overrides?: Partial<ElMessageBoxOptions>,
  ): Promise<void> {
    await ElMessageBox.alert(message, title, {
      type: 'success',
      confirmButtonText: '确定',
      ...overrides,
    } as ElMessageBoxOptions)
  }

  // ==================== 通用兜底 ====================

  /**
   * 通用确认弹窗 — 保留 ElMessageBox 全部能力，供特殊情况使用
   */
  async function confirm(
    message: string,
    title: string,
    options?: Partial<ElMessageBoxOptions>,
  ): Promise<Action> {
    return ElMessageBox.confirm(message, title, options)
  }

  return {
    // 破坏性
    confirmDelete,
    confirmDeleteWithInput,
    confirmBatchDelete,
    // 警示
    confirmLeave,
    confirmDisable,
    confirmToggle,
    confirmResetPwd,
    confirmLogout,
    confirmRemove,
    confirmBatchRemove,
    // 成功
    showSuccessAlert,
    // 兜底
    confirm,
  }
}
