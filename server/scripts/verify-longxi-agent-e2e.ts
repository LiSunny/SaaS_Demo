/**
 * 中冶龙熙半岛 AI 数据链 — 端到端验收（真实调用 LLM + Agent 工具链）
 *
 * 以「中冶龙熙半岛」企业账号的真实 scope 驱动 agent.service.streamChat，
 * 验证 AI 能查到并正确汇总该企业的测试数据。
 *
 * 用法：cd server && npx tsx scripts/verify-longxi-agent-e2e.ts
 */

import { streamChat, type AgentScope } from '../src/services/agent.service.js'

const ENT_ID = 27
const ENT_NAME = '中冶龙熙半岛'

/** 与 resolveScope 对齐：该企业联系人账号（groups=unit）的可见范围 */
const scope: AgentScope = {
  systemRole: null,
  groups: ['unit'],
  enterpriseNames: [ENT_NAME],
  enterpriseIds: [ENT_ID],
  realName: '张晓明',
}

const QUESTIONS = [
  '中冶龙熙半岛今天有几条告警？分别是什么？',
  '中冶龙熙半岛目前有哪些未处理的告警和未整改的隐患？',
  '中冶龙熙半岛的设备台账情况怎么样，有多少台离线或故障？',
]

async function ask(q: string): Promise<string> {
  let out = ''
  const tools: string[] = []
  for await (const ev of streamChat(q, [], undefined, scope)) {
    const e = ev as any
    if (e.type === 'token') out += e.content
    if (e.type === 'debug' && e.node === 'tool_call') tools.push(e.label || e.detail?.工具 || '')
  }
  if (tools.length) console.log(`   [工具调用] ${tools.join(' → ')}`)
  return out
}

async function main() {
  console.log(`\n🤖 端到端验证：以「${ENT_NAME}」账号视角向 AI 提问（真实 LLM + 真实数据库）\n`)
  for (const q of QUESTIONS) {
    console.log(`❓ ${q}`)
    const ans = await ask(q)
    console.log(`💬 ${ans.trim()}\n`)
  }
}

main()
  .catch((e) => {
    console.error('❌ 端到端验证失败：', e)
    process.exit(1)
  })
  .finally(() => process.exit(0))
