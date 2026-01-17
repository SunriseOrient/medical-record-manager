<template>
  <!-- 交流历史对话框 -->
  <el-dialog v-model="showDialog" title="交流历史" width="800px" class="chat-history-dialog" :fullscreen="isMobile">
    <div class="chat-history-modal">
      <div class="modal-toolbar">
        <el-button @click="handleRefresh" :loading="loading" size="small">
          刷新
        </el-button>
        <span class="total-count">共 {{ historyList.length }} 条记录</span>
      </div>
      <div v-if="historyList.length === 0" class="empty-state">
        暂无聊天记录
      </div>
      <div v-else class="chat-messages-scroll">
        <div v-for="(chat, idx) in historyList" :key="idx" class="chat-message-item">
          <div class="message-time">{{ formatDateTime(chat.timestamp) }}</div>
          <div class="message-user">
            <span class="badge user-badge">USER</span>
            <span class="message-text">{{ chat.userMessage }}</span>
          </div>
          <div class="message-ai">
            <span class="badge ai-badge">AI</span>
            <div class="message-text ai-content" v-html="renderMarkdown(chat.aiReply)"></div>
          </div>
          <el-divider />
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="showDialog = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { chatAPI } from "../services/api";
import { ElMessage } from "element-plus";

// 移动端检测
const isMobile = ref(window.innerWidth <= 768);
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

// Props 和 Emits
const props = defineProps({
  modelValue: Boolean,
  userId: String,
  currentPatientId: String,
});

const emit = defineEmits(["update:modelValue"]);

// 对话框状态
const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const historyList = ref([]);
const loading = ref(false);

// 工具方法
const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
};

const md = new MarkdownIt({
  linkify: true,
  breaks: true,
});

const renderMarkdown = (text) => DOMPurify.sanitize(md.render(text || ""));

// 业务逻辑方法
const loadChatHistory = async () => {
  if (!props.currentPatientId) {
    ElMessage.warning("请先选择就诊人");
    return;
  }

  try {
    loading.value = true;
    const response = await chatAPI.getHistory(props.userId, props.currentPatientId);
    historyList.value = response.data.data.chatHistory || [];
  } catch (error) {
    ElMessage.error("加载交流历史失败");
    console.error("加载交流历史出错:", error);
  } finally {
    loading.value = false;
  }
};

const handleRefresh = () => {
  loadChatHistory();
};

// 暴露给父组件调用
const open = () => {
  loadChatHistory();
  showDialog.value = true;
};

defineExpose({
  open,
  loadChatHistory,
});
</script>

<style scoped>
.chat-history-modal {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.modal-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #1f2937;
}

.total-count {
  color: #9ca3af;
  font-size: 14px;
}

.chat-messages-scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.chat-message-item {
  margin-bottom: 16px;
  padding-bottom: 16px;
}

.message-time {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.message-user,
.message-ai {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: flex-start;
}

.badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.user-badge {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.ai-badge {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.message-text {
  flex: 1;
  color: #e5e7eb;
  word-break: break-word;
  line-height: 1.5;
}

.ai-content {
  color: #e5e7eb;
  line-height: 1.6;
  word-break: break-word;
}

.ai-content :deep(p) {
  margin: 0 0 8px;
}

.ai-content :deep(code) {
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 5px;
  border-radius: 6px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.ai-content :deep(pre) {
  background: #0b0f14;
  color: #f8f8f8;
  padding: 10px;
  border-radius: 10px;
  overflow-x: auto;
  margin: 8px 0;
}

.ai-content :deep(ul),
.ai-content :deep(ol) {
  padding-left: 20px;
  margin: 6px 0;
}

.ai-content :deep(a) {
  color: #3b82f6;
  word-break: break-all;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #9ca3af;
}

/* 移动端适配 */
@media (max-width: 768px) {

  .chat-history-modal {
    height: 60vh;
  }

  .modal-toolbar {
    margin-bottom: 12px;
    padding-bottom: 10px;
  }

  .total-count {
    font-size: 12px;
  }

  .chat-message-item {
    margin-bottom: 14px;
    padding-bottom: 14px;
  }

  .message-time {
    font-size: 11px;
  }

  .message-user,
  .message-ai {
    gap: 6px;
  }

  .badge {
    padding: 2px 5px;
    font-size: 10px;
  }

  .message-text {
    font-size: 14px;
  }

  .ai-content {
    font-size: 13px;
  }

  .ai-content :deep(pre) {
    padding: 8px;
    font-size: 12px;
  }

  .empty-state {
    padding: 30px 20px;
  }
}
</style>
