#!/usr/bin/env bash
# 一次性配置：让 Claude (xin user) 可以无密码 sudo systemctl restart mealmate /
# cloudflared，方便后端代码改完后自动 reload。
#
# 跑法（一行）：
#   sudo bash /home/xin/document/mealmate-app/backend/scripts/install-claude-sudo.sh
#
# 配完 visudo -cf 自动校验语法，输出 "... parsed OK" 即成功。
# 仅 systemctl 白名单这几条无密码，其他 sudo 命令仍要密码（最小权限）。

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "此脚本必须用 sudo 跑：sudo bash $0" >&2
  exit 1
fi

DEST=/etc/sudoers.d/mealmate-claude

cat > "$DEST" <<'EOF'
xin ALL=(ALL) NOPASSWD: /usr/bin/systemctl daemon-reload, /usr/bin/systemctl restart mealmate, /usr/bin/systemctl restart cloudflared, /usr/bin/systemctl restart mealmate.service, /usr/bin/systemctl restart cloudflared.service, /usr/bin/systemctl status mealmate, /usr/bin/systemctl status cloudflared, /usr/bin/systemctl status mealmate cloudflared, /usr/bin/systemctl status mealmate cloudflared --no-pager
EOF

chmod 0440 "$DEST"

# 语法校验
if visudo -cf "$DEST"; then
  echo ""
  echo "✓ 已写入 $DEST 并通过语法校验"
  echo "  Claude 现在可以直接 sudo systemctl restart mealmate（不再要密码）"
else
  echo "✗ 语法校验失败，已删除文件" >&2
  rm -f "$DEST"
  exit 1
fi
