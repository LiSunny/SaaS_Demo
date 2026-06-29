#!/bin/bash
# ---------------------------------------------------------------------------
# dev-fresh.sh — 释放端口 → 启动前后端 → 显示就绪信息
#
# 用法：bash scripts/dev-fresh.sh
#      npm run dev:fresh
# ---------------------------------------------------------------------------
set -e

FE_PORT=3200
BE_PORT=3201
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PIDS=()

# ── 工具 ────────────────────────────────────────────────────────────────────

kill_node_on_port() {
  local port=$1
  local pid
  pid=$(lsof -ti ":$port" -sTCP:LISTEN 2>/dev/null) || true
  [ -z "$pid" ] && return 0

  local cmd
  cmd=$(ps -p "$pid" -o comm= 2>/dev/null || true)
  # 检查进程名是否以 node 结尾（兼容 /path/to/node、node20 等变体）
  if [[ ! "$cmd" =~ /?node[0-9]*$ ]]; then
    echo -e "${RED}❌ 端口 $port 被非 node 进程占用（$cmd, PID $pid），请手动处理${NC}"
    return 1
  fi

  echo -e "${YELLOW}⚠️  端口 $port 被 node (PID $pid) 占用，正在释放…${NC}"
  kill "$pid" 2>/dev/null || true
  sleep 0.5
  kill -0 "$pid" 2>/dev/null && { kill -9 "$pid" 2>/dev/null || true; sleep 0.3; }
  echo -e "${GREEN}✅ 端口 $port 已释放${NC}"
}

# ── 1. 释放端口 ──────────────────────────────────────────────────────────────

echo -e "${BOLD}${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║   🔧 检查端口占用…                  ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

kill_node_on_port $FE_PORT
kill_node_on_port $BE_PORT

# ── 2. 启动后端（后台）───────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║   🚀 启动后端服务 (Express)         ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

cd "$PROJECT_ROOT/server"
npm run dev &
BE_PID=$!
PIDS+=($BE_PID)
cd "$PROJECT_ROOT"

# 快速失败：如果后端进程已死，提前报错
sleep 1
if ! kill -0 "$BE_PID" 2>/dev/null; then
  echo ""
  echo -e "${RED}❌ 后端进程启动后立即退出，请检查 server/ 依赖是否安装（npm install）${NC}"
  exit 1
fi

echo -ne "${YELLOW}⏳ 等待后端就绪${NC}"
for i in $(seq 1 30); do
  if lsof -ti ":$BE_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}✅ 后端已就绪${NC}"
    break
  fi
  echo -ne "."
  sleep 0.5
done

if ! lsof -ti ":$BE_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo ""
  echo -e "${RED}❌ 后端启动超时（15s），请检查 server/ 下的错误日志${NC}"
  kill "$BE_PID" 2>/dev/null || true
  exit 1
fi

# ── 3. 启动前端（后台）───────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║   🚀 启动前端服务 (Vite)            ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

npm run dev &
FE_PID=$!
PIDS+=($FE_PID)

echo -ne "${YELLOW}⏳ 等待前端就绪${NC}"
for i in $(seq 1 30); do
  if lsof -ti ":$FE_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}✅ 前端已就绪${NC}"
    break
  fi
  echo -ne "."
  sleep 0.5
done

if ! lsof -ti ":$FE_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo ""
  echo -e "${RED}❌ 前端启动超时（15s）${NC}"
  kill "${PIDS[@]}" 2>/dev/null || true
  exit 1
fi

# ── 4. 就绪 Banner ────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║                                          ║${NC}"
echo -e "${GREEN}${BOLD}║   ✅  开发环境就绪！                     ║${NC}"
echo -e "${GREEN}${BOLD}║                                          ║${NC}"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}║                                          ║${NC}"
echo -e "${GREEN}${BOLD}║   前端  ${NC}${CYAN}http://localhost:${FE_PORT}${NC}                   ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}║   后端  ${NC}${CYAN}http://localhost:${BE_PORT}${NC}                   ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}║   API   ${NC}${CYAN}/api/* → :${BE_PORT}${NC}                        ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}║                                          ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════╝${NC}"
echo -e "        按 ${YELLOW}Ctrl+C${NC} 停止所有服务"
echo ""

# ── 5. 清理 ────────────────────────────────────────────────────────────────

cleanup() {
  echo ""
  echo -e "${YELLOW}🛑 正在停止服务…${NC}"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait "${PIDS[@]}" 2>/dev/null || true
  echo -e "${GREEN}✅ 已停止所有服务${NC}"
}
trap cleanup EXIT INT TERM

# 前台挂起，等待任一子进程退出
wait -n "${PIDS[@]}" 2>/dev/null || true
