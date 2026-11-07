#!/bin/sh
# Prepare a fresh Apple Silicon Mac checkout; starting services is a separate step.
set -eu
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$PROJECT_DIR"

if [ "$(uname -s):$(uname -m)" != "Darwin:arm64" ]; then
  echo "当前部署脚本只支持 Apple Silicon Mac，请参阅 DEPLOYMENT.md。" >&2
  exit 1
fi
if ! command -v uv >/dev/null 2>&1; then
  echo "请先安装 uv：https://docs.astral.sh/uv/getting-started/installation/" >&2
  exit 1
fi
if [ ! -x .venv/bin/python ]; then
  uv venv --python 3.11 .venv
fi
uv pip install --python .venv/bin/python -r requirements.txt
.venv/bin/python scripts/bootstrap.py
echo "部署文件已准备好。启动：.venv/bin/python scripts/run.py"
echo "小院地址：http://127.0.0.1:18080/bricks.html"
