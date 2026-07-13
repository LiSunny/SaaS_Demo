#!/bin/bash
# ==========================================
# maintenance-demo 一键部署 + 数据库管理脚本
# 用法:
#   ./deploy.sh frontend       只更新前端
#   ./deploy.sh backend        只更新后端
#   ./deploy.sh all            前后端一起更新
#   ./deploy.sh db-studio      浏览器查看线上数据库（Prisma Studio）
#   ./deploy.sh db-shell       命令行查看线上数据库（SQLite）
#   ./deploy.sh db-dev         浏览器查看开发环境数据库（Prisma Studio）
# ==========================================

SERVER="root@60.205.170.250"
FRONTEND_PATH="/opt/myapp/frontend"
BACKEND_PATH="/opt/myapp/backend"

set -e

deploy_frontend() {
  echo ""
  echo "📦 编译前端..."
  npm run build

  echo ""
  echo "📤 上传前端到服务器..."
  scp -r dist/* "${SERVER}:${FRONTEND_PATH}/"

  echo ""
  echo "✅ 前端更新完成 → http://60.205.170.250"
}

deploy_backend() {
  echo ""
  echo "📤 上传后端代码到服务器..."
  rsync -av --exclude 'node_modules' --exclude 'dev.db' --exclude '.env' \
    server/ "${SERVER}:${BACKEND_PATH}/"

  echo ""
  echo "📦 服务器上安装依赖..."
  ssh "${SERVER}" "cd ${BACKEND_PATH} && npm install"

  echo ""
  echo "🗄️  同步数据库 schema..."
  ssh "${SERVER}" "cd ${BACKEND_PATH} && npx prisma db push"

  echo ""
  echo "🔄 重启后端..."
  ssh "${SERVER}" "pm2 restart myapp-backend --update-env"

  echo ""
  echo "✅ 后端更新完成"
}

# ==========================================
# 数据库管理
# ==========================================

db_studio() {
  local PORT="${1:-5555}"

  echo ""
  echo "🗄️  连接线上数据库..."
  echo "   → SSH 隧道 localhost:${PORT} → 服务器 Prisma Studio"
  echo "   → 浏览器会自动打开 Prisma Studio 界面"
  echo "   → 查看完毕后按 Ctrl+C 断开"
  echo ""

  # 后台打开浏览器
  sleep 2 && open "http://localhost:${PORT}" 2>/dev/null &

  # SSH 端口转发 + 启动 Prisma Studio（前台运行，Ctrl+C 即退出）
  ssh -t -L "${PORT}:localhost:${PORT}" "${SERVER}" \
    "cd ${BACKEND_PATH} && echo '✅ Prisma Studio 就绪' && npx prisma studio --port ${PORT}"
}

db_shell() {
  echo ""
  echo "🗄️  连接线上数据库 SQLite..."
  echo "   （输入 .exit 或按 Ctrl+D 退出）"
  echo ""
  ssh -t "${SERVER}" "sqlite3 ${BACKEND_PATH}/prisma/dev.db"
}

db_dev() {
  local PORT="${1:-5556}"

  echo ""
  echo "🗄️  打开本地开发环境数据库..."
  echo "   → 本地 Prisma Studio http://localhost:${PORT}"
  echo "   → 查看完毕后按 Ctrl+C 断开"
  echo ""

  cd "$(dirname "$0")/server"

  sleep 1 && open "http://localhost:${PORT}" 2>/dev/null &

  npx prisma studio --port "${PORT}"
}

case "${1}" in
  frontend)
    deploy_frontend
    ;;
  backend)
    deploy_backend
    ;;
  all)
    deploy_frontend
    deploy_backend
    ;;
  db-studio)
    db_studio "$2"
    ;;
  db-shell)
    db_shell
    ;;
  db-dev)
    db_dev "$2"
    ;;
  *)
    echo "用法: ./deploy.sh {frontend|backend|all|db-studio|db-shell|db-dev}"
    echo ""
    echo "  frontend    只更新前端"
    echo "  backend     只更新后端"
    echo "  all         前后端一起更新"
    echo "  db-studio   浏览器查看线上数据库（可指定端口，默认 5555）"
    echo "  db-shell    命令行查看线上数据库"
    echo "  db-dev      浏览器查看本地开发数据库（可指定端口，默认 5556）"
    exit 1
    ;;
esac
