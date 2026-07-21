<template>
  <div class="step-team">
    <template v-if="!editing">
      <div class="view-body">
        <div class="info-row">
          <span class="info-label">执行角色</span>
          <span class="info-value">{{ stepMeta?.executor || '—' }}</span>
        </div>
        <div class="info-row" v-if="members.length">
          <span class="info-label">小组成员</span>
          <div class="member-list-readonly">
            <div v-for="m in members" :key="m.id" class="member-chip">
              <span class="chip-role">{{ m.role }}</span>
              <span class="chip-name">{{ m.userName }}</span>
              <span class="chip-pos">{{ positionLabel(m.positionKey) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="info-row">
          <span class="info-label">小组成员</span>
          <span class="info-value" style="color:var(--text-muted)">暂未添加</span>
        </div>
        <div class="info-row">
          <span class="info-label">完成人</span>
          <span class="info-value">{{ step.completedBy || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">完成时间</span>
          <span class="info-value">{{ step.completedAt || '—' }}</span>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="drawer-form-body">
        <div class="form-row form-row-top">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">小组成员</span>
          </div>
          <div class="form-control">
            <table class="member-table">
              <thead>
                <tr>
                  <th class="col-role">角色</th>
                  <th class="col-name">姓名</th>
                  <th class="col-pos">岗位</th>
                  <th class="col-op"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(m, i) in form.members" :key="i">
                  <td>
                    <el-select v-model="m.role" :teleported="false" popper-class="fi-popper" class="clean-select-sm">
                      <el-option v-for="r in ROLES" :key="r" :label="r" :value="r" />
                    </el-select>
                  </td>
                  <td>
                    <el-input v-model="m.userName" placeholder="姓名" maxlength="20" class="clean-input-sm" />
                  </td>
                  <td>
                    <el-select v-model="m.positionKey" :teleported="false" popper-class="fi-popper" class="clean-select-sm">
                      <el-option v-for="p in POSITIONS" :key="p.key" :label="p.label" :value="p.key" />
                    </el-select>
                  </td>
                  <td class="td-center">
                    <button class="btn-remove-row" @click="removeMember(i)" :disabled="form.members.length <= 1">✕</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <button class="btn-add-row" @click="addMember">+ 添加成员</button>
          </div>
        </div>

        <div class="form-row form-row-top">
          <div class="form-label">
            <span class="label-text">备注</span>
          </div>
          <div class="form-control">
            <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注信息" maxlength="200" class="clean-input" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { STEP_META } from '@/types/resumption'
import { getTeamMembers } from '@/api/adapters/resumption-dao'
import type { ResumptionStep, OrgTeamMember } from '@/types/resumption'

const props = defineProps<{ step: ResumptionStep; editing: boolean; planId: number }>()
const stepMeta = STEP_META.find(m => m.type === props.step.stepType)

const ROLES = ['组长', '副组长', '成员'] as const

const POSITIONS = [
  { key: 'workshop-director', label: '车间主任' },
  { key: 'workshop-safety-officer', label: '车间安全员' },
  { key: 'team-leader', label: '班组长' },
  { key: 'team-member', label: '班组成员' },
  { key: 'factory-director', label: '厂长/总经理' },
]

function positionLabel(key: string): string {
  return POSITIONS.find(p => p.key === key)?.label || key
}

const members = reactive<OrgTeamMember[]>([])

async function loadMembers() {
  const list = await getTeamMembers(props.planId)
  members.splice(0, members.length, ...list)
}

interface MemberForm { role: string; userName: string; positionKey: string }

const form = reactive<{ members: MemberForm[]; remark: string }>({
  members: [],
  remark: '',
})

function syncFormFromMembers() {
  form.members = members.map(m => ({ role: m.role, userName: m.userName, positionKey: m.positionKey }))
  form.remark = props.step.remark
}

function addMember() {
  form.members.push({ role: '成员', userName: '', positionKey: 'team-member' })
}

function removeMember(index: number) {
  if (form.members.length > 1) form.members.splice(index, 1)
}

watch(() => props.editing, (val) => {
  if (val) syncFormFromMembers()
})

function getSaveData() {
  return {
    completedBy: form.members.find(m => m.role === '组长')?.userName || '',
    remark: form.remark,
    status: 'done' as const,
    teamMembers: form.members.map(m => ({
      role: m.role as OrgTeamMember['role'],
      userName: m.userName,
      positionKey: m.positionKey,
    })),
  }
}

defineExpose({ getSaveData, loadMembers })
</script>

<style scoped>
.step-team { display: flex; flex-direction: column; flex: 1; }
.view-body { display: flex; flex-direction: column; gap: var(--spacing-lg, 12px); }
.info-row { display: flex; gap: var(--spacing-lg, 12px); }
.info-label { font-size: var(--font-body, 16px); color: var(--text-tertiary, #454545); min-width: 70px; flex-shrink: 0; }
.info-value { font-size: var(--font-body, 16px); color: var(--text-primary); }

.member-list-readonly { display: flex; flex-wrap: wrap; gap: 6px; }
.member-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: var(--radius-sm, 6px);
  background: var(--bg-sub-card); font-size: var(--font-small, 14px);
}
.chip-role { color: var(--accent-primary); font-weight: 500; }
.chip-name { color: var(--text-primary); }
.chip-pos { color: var(--text-muted); font-size: var(--font-xs, 12px); }

/* ===== 编辑模式 ===== */

.member-table { width: 100%; border-collapse: collapse; margin-bottom: var(--spacing-sm, 6px); }
.member-table th { text-align: left; font-size: var(--font-xs, 12px); color: var(--text-muted); padding: 4px 4px; border-bottom: 1px solid var(--border-low); }
.member-table td { padding: 3px 2px; }
.col-role { width: 90px; } .col-name { flex: 1; } .col-pos { width: 130px; } .col-op { width: 36px; text-align: center; }
.td-center { text-align: center; }
</style>

<style>
@import './shared-form.css';
</style>
