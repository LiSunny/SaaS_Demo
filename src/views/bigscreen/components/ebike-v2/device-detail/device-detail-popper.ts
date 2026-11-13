/**
 * 设备详情抽屉 · EP 浮层（日期面板 / 下拉）层级约定
 *
 * 背景：抽屉自身是 z-index 10031（遮罩）/ 10032（面板），
 * 而 Element Plus 的 popper 默认从 2000 起按 `useZIndex.nextZIndex()` 递增，
 * 弹层又是 teleport 到 body 的 —— 于是抽屉里的日期面板、下拉会被整块抽屉盖住，
 * 看得见输入框却点不开面板。
 *
 * 办法：给抽屉内用到的 EP 浮层加一个专属 class（DD_POPPER_CLASS），
 * 在全局样式 `styles/bigscreen-ep.scss` 里用 `!important` 抬高 z-index。
 *
 * 为什么不能靠 prop：
 *   - ElPopper 只认 `zIndex` 这一个 prop，el-date-picker / el-select 都不暴露它；
 *   - `popper-options` 会被原样转给 ElPopper，而 ElPopper 没有 popperOptions prop，
 *     塞进去不生效（实测 z-index 仍是 2000 段）；
 *   - 浮层 teleport 到 body，**不受 scoped 样式约束**，层级只能靠全局 CSS 提。
 */

/** 抽屉内浮层的专属 class（配合 bigscreen-ep.scss 里的层级规则） */
export const DD_POPPER_CLASS = 'dd-popper'

/**
 * 抽屉内浮层层级
 *
 * 需高于抽屉面板的 10032；低于告警弹窗的 10040（两者不在同一页，留出余量）。
 */
export const DD_POPPER_Z_INDEX = 10036
