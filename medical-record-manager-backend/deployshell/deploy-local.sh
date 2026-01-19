#!/bin/bash

# 关闭调试模式
set +x
# 设置脚本执行模式：遇到错误退出
set -e

# 定义变量
PROJECT_DIR="medical-record-manager-backend"
TEMP_DIR="temp_package"

# 显示当前工作目录
echo "当前工作目录: $(pwd)"

# 步骤1: 创建临时打包目录
echo "========================================="
echo "步骤1: 创建临时打包目录"

# 清理旧的临时目录（如果存在）
if [ -d "$TEMP_DIR" ]; then
    echo "清理旧的临时目录..."
    rm -rf "$TEMP_DIR"
fi

mkdir -p "$TEMP_DIR"
echo "✅ 临时目录已创建: $TEMP_DIR"

# 步骤2: 复制文件到临时目录
echo "========================================="
echo "步骤2: 复制文件到临时目录"

# 复制文件和文件夹
for item in src .env .npmrc package-lock.json package.json; do
    if [ -e "$item" ]; then
        echo "复制: $item"
        cp -r "$item" "$TEMP_DIR/"
    else
        echo "⚠️  警告: $item 不存在，跳过"
    fi
done

echo "✅ 文件复制完成"

# 步骤3: 打包临时目录
echo "========================================="
echo "步骤3: 打包文件"

echo "正在打包..."
tar -czf "$PROJECT_DIR.tar.gz" -C "$TEMP_DIR" .

if [ ! -f "$PROJECT_DIR.tar.gz" ]; then
    echo "❌ 错误: 打包失败，$PROJECT_DIR.tar.gz 文件未创建"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo "✅ 打包完成: $PROJECT_DIR.tar.gz"
echo "文件大小: $(du -h $PROJECT_DIR.tar.gz | cut -f1)"

# 清理临时目录
echo "清理临时目录..."
rm -rf "$TEMP_DIR"

echo "========================================="
echo "✅ 打包完成!"
echo "压缩包: $PROJECT_DIR.tar.gz"
echo "将此文件上传到部署服务器进行部署..."