#!/bin/bash

set -euo pipefail

PROJECT_NAME="medical-record-manager-backend"
ARCHIVE_PATH="/tmp/${PROJECT_NAME}.tar.gz"
CONTAINER_NAME="$PROJECT_NAME"
CONTAINER_TMP="/tmp"
TARGET_DIR="/production/${PROJECT_NAME}"
TARGET_PARENT="/production"
LOG_PATH="/tmp/${PROJECT_NAME}.log"
PID_PATH="/tmp/${PROJECT_NAME}.pid"

if [[ ! -f "$ARCHIVE_PATH" ]]; then
	echo "未找到压缩包: $ARCHIVE_PATH" >&2
	exit 1
fi

if ! /usr/local/bin/docker ps -a --format '{{.Names}}' | grep -Fx "$CONTAINER_NAME" >/dev/null 2>&1; then
	echo "未找到容器: $CONTAINER_NAME" >&2
	exit 1
fi

echo "正在将压缩包拷入容器..."
/usr/local/bin/docker cp "$ARCHIVE_PATH" "$CONTAINER_NAME":"$CONTAINER_TMP"/

echo "正在停止容器内的 Node 进程..."
/usr/local/bin/docker exec "$CONTAINER_NAME" sh -c "pm2 delete 'backend' || true"

echo "正在删除已有的部署目录..."
/usr/local/bin/docker exec "$CONTAINER_NAME" sh -c "rm -rf '$TARGET_DIR'"

echo "正在解压缩到 $TARGET_DIR..."
/usr/local/bin/docker exec "$CONTAINER_NAME" sh -c "mkdir -p '$TARGET_DIR' && tar -xzf '$CONTAINER_TMP/$(basename "$ARCHIVE_PATH")' -C '$TARGET_DIR' --strip-components=1"

echo "正在安装依赖..."
/usr/local/bin/docker exec "$CONTAINER_NAME" sh -c "cd '$TARGET_DIR' && npm install"

echo "正在后台启动服务..."
/usr/local/bin/docker exec "$CONTAINER_NAME" sh -c "cd '$TARGET_DIR' && pm2 start src/index.js --name 'backend' && pm2 save && pm2 logs 'backend' > '$LOG_PATH' 2>&1 &"

echo "部署完成，服务应已在容器内运行。"