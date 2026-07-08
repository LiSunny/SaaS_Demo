# UI 组件实现范式

> 写任何 UI 前必须先读本文档。场景不匹配 → 提问，不要猜测。

---

## 一、核心原则

**组件用 Element Plus，视觉用全局样式覆盖。**

| 层 | 机制 | 示例 |
|----|------|------|
| 功能 | Element Plus 组件 | `el-dialog` `el-drawer` `el-form` `el-select` `el-input` `el-pagination` |
| 视觉 | 全局 CSS 覆盖 | `style.css` 映射 EP 变量；项目 class（`btn-primary` `fi-table` `StatusTag`） |

---

## 二、列表页 — 范式文件

> **范式文件：`src/views/admin/EnterpriseList.vue`**
>
> 列表页所有元素（筛选、表头、排序、筛选弹窗、表格、分页）以此为唯一参考。

### 2.1 页面骨架

```
.content-card
  ├── 引导卡片（可选）
  ├── .filter-bar → .filter-left + .filter-right
  ├── .table-wrap → table.fi-table > thead > tbody
  └── .pagination-wrap → el-pagination
```

### 2.2 筛选栏

```html
<div class="filter-bar">
  <div class="filter-left">
    <div class="search-input-wrap">
      <input v-model="query.keyword" class="fi-input" placeholder="..." @keyup.enter="search()" />
      <button v-if="query.keyword" class="fi-clear" @click="query.keyword = ''; search()">
        <AppIcon name="clear" />
      </button>
      <AppIcon name="search" class="fi-icon" />
    </div>
    <button class="btn-primary" @click="search()">查询</button>
  </div>
  <div class="filter-right">
    <!-- 可选：toggle / 筛选 / 按钮 -->
    <button class="btn-outline-primary" @click="openCreate">
      <AppIcon name="plus" class="btn-add-icon" />新增
    </button>
  </div>
</div>
```

参考行：`EnterpriseList.vue:27-49`

### 2.3 表头（含排序 + 筛选）

```html
<th class="fi-th fi-th-sort col-status" @click="toggleSort">
  <span>状态</span>
  <TableSortIcon :direction="sortDir" />
  <TableFilterPopover v-model="filter" :options="filterOptions" />
</th>
<th class="fi-th col-name"><span>列名</span></th>
```

- 可排序列：`fi-th` + `fi-th-sort` + `TableSortIcon`
- 可筛选列：`TableFilterPopover`（popover 内 el-checkbox-group）
- 普通列：仅 `fi-th` + `<span>`

参考行：`EnterpriseList.vue:54-69`

### 2.4 表格

```html
<div class="table-wrap">
  <table class="fi-table">
    <thead>
      <tr class="fi-thead-tr">...</tr>
    </thead>
    <tbody v-loading="store.loading">
      <tr v-for="row in list" :key="row.id" class="fi-tbody-tr">
        <td class="fi-td col-xxx">...</td>
      </tr>
    </tbody>
  </table>
</div>
```

- 表头固定：`.fi-table thead { position: sticky; top: 0; z-index: 1; }`
- 仅 `.table-wrap` 内滚动，`.content-card { overflow: hidden }`

参考行：`EnterpriseList.vue:51-93`

### 2.5 分页

```html
<div class="pagination-wrap">
  <span class="pagi-total">共 {{ total }} 条记录 第 {{ page }}/{{ totalPages }} 页</span>
  <el-pagination
    v-model:current-page="query.page"
    v-model:page-size="query.size"
    :total="total"
    :page-sizes="[10, 20, 50, 100]"
    layout="sizes, prev, pager, next, jumper"
    background
    @change="fetchList()"
  />
</div>
```

参考行：`EnterpriseList.vue:96-107`

分页器 EP 变量覆盖（每个列表页需要）：`EnterpriseList.vue:320-326`

### 2.6 列头与内容同策

每条列 `<th>` 和 `<td>` 用同一个 `col-*` class：

```css
.col-name.fi-th, .col-name.fi-td { text-align: left; }
```

| 列类型 | 宽度 | 对齐 |
|--------|------|:---:|
| 文字列 | `min-width` 不设固定宽 | 左 |
| 状态列 | `width: 90px` | 中 |
| 日期列 | `min-width: 110px` | 左 |
| 操作列（少按钮） | `width: 70px; min-width: 70px` | 中 |

参考行：`EnterpriseList.vue:284-293`

### 2.7 操作列

```html
<td class="fi-td col-actions">
  <div class="action-cell">
    <button class="act-btn act-preview" title="查看"><AppIcon name="preview" class="act-icon" /></button>
    <button class="act-btn act-delete" title="删除"><AppIcon name="delete" class="act-icon" /></button>
  </div>
</td>
```

`.action-cell` → `display: flex; justify-content: center; gap: var(--spacing-lg)`
`act-btn` → 默认灰色；`act-delete` → `var(--danger)`；`act-edit` → `var(--accent-primary)`

---

## 三、表单 — 范式文件

> **范式文件：`src/components/business/EnterpriseFormDrawer.vue`**
>
> 表单所有元素（布局、字段、校验、提交）以此为唯一参考。

### 3.1 表单容器

```html
<el-drawer v-model="visible" title="标题" size="720px" destroy-on-close @closed="handleClosed">
  <template #header>
    <div class="drawer-custom-header">
      <h3 class="drawer-custom-title">{{ mode === 'create' ? '新增' : '编辑' }}</h3>
    </div>
  </template>

  <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="drawer-form">

    <!-- 分组卡片 -->
    <div class="section-card">
      <div class="section-header">
        <h4 class="section-title">分组标题</h4>
      </div>
      <div class="section-body">
        <el-form-item label="字段" prop="field">
          <el-input v-model="form.field" placeholder="请输入" />
        </el-form-item>
      </div>
    </div>

  </el-form>

  <template #footer>
    <button class="btn-default" @click="visible = false">取消</button>
    <button class="btn-primary" :disabled="saving" @click="submit">{{ saving ? '保存中...' : '保存' }}</button>
  </template>
</el-drawer>
```

### 3.2 表单控件粒度

| 控件类型 | 组件 | 关键 Props |
|---------|------|-----------|
| 文本输入 | `<el-input>` | `placeholder` `maxlength` `clearable` |
| 文本域 | `<el-input type="textarea">` | `:rows="3"` |
| 下拉选择 | `<el-select>` | `placeholder` `clearable` `filterable` |
| 远程搜索 | `<el-select>` + `remote` `remote-method` | `filterable remote reserve-keyword` |
| 多选 | `<el-select multiple>` | `collapse-tags` `collapse-tags-tooltip` |
| 开关 | `<el-switch>` | `size="small"` |
| 日期 | `<el-date-picker type="date">` | `placeholder` `format="YYYY-MM-DD"` `value-format="YYYY-MM-DD"` |
| 单选 | `<el-radio-group>` + `<el-radio>` | — |

### 3.3 表单校验

```ts
const rules: FormRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { max: 50, message: '不超过 50 字', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
}
```

### 3.4 提交模式

```ts
const saving = ref(false)
async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await apiCall(form)
    ElMessage.success('保存成功')
    emit('saved')
    visible.value = false
  } catch { /* error handled by interceptor */ }
  finally { saving.value = false }
}
```

### 3.5 按钮行

弹窗 footer：
```html
<template #footer>
  <button class="btn-default" @click="visible = false">取消</button>
  <button class="btn-primary" :disabled="saving" @click="submit">保存</button>
</template>
```

抽屉表单内按钮行（不在 footer 插槽时）：
```html
<div class="form-actions">
  <button class="btn-primary" :disabled="saving" @click="submit">保存</button>
  <button class="btn-default" @click="reset">取消</button>
</div>
```

```css
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-lg);
}
```

---

## 四、间距 / 字号 / 颜色

禁止硬编码。Token 速查：

| 类别 | Token |
|------|-------|
| 间距 | `var(--spacing-xs)` 4px / `--spacing-md` 8px / `--spacing-lg` 12px / `--spacing-xl` 16px / `--spacing-xxl` 24px |
| 字号 | `var(--font-xs)` 12px / `--font-small` 14px / `--font-body` 16px / `--font-h4` 16px / `--font-h1` 24px |
| 文字 | `var(--text-primary)` / `--text-secondary` / `--text-muted` |
| 主色 | `var(--accent-primary)` |
| 危险 | `var(--danger)` |
| 圆角 | `var(--radius-sm)` 6px / `--radius-md` 8px |

完整 token → `src/style.css:1-130`

---

## 五、自查清单

写 UI 前按顺序检查：

| # | 检查项 | 参考 |
|---|--------|------|
| 1 | 列表页 | `EnterpriseList.vue` — 筛选栏、表头、表格、分页 |
| 2 | 表单 | `EnterpriseFormDrawer.vue` — 布局、控件、校验、提交 |
| 3 | 按钮 | `btn-primary` / `btn-default` / `act-btn` |
| 4 | 表格 | 主列表 `fi-table`，抽屉内 `el-table` |
| 5 | 标签 | `StatusTag` |
| 6 | 列宽 | 按决策表选策略，不从其他表格复制 |
| 7 | 列头内容 | 同一 class，同一对齐 |
| 8 | 标签容器 | `inline-flex` 非 `flex` |
| 9 | 间距/字号/颜色 | `var(--xxx)` 非硬编码 |
| 10 | 一致性 | 同文件内同类元素是否一致？不一致 → 提问 |

**场景不匹配 → 提问，不要猜测。**
