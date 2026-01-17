<template>
  <div class="chat-page">
    <div class="bg-spotlight"></div>

    <header class="chat-header">
      <div class="brand">
        <div class="brand-logo">MR</div>
        <div class="brand-text">
          <p class="brand-kicker">今天有什么可以帮到你？</p>
        </div>
      </div>
      <div class="header-actions">
        <el-select v-model="currentPatientId" placeholder="选择就诊人" class="compact-select" size="small">
          <el-option v-for="patient in patients" :key="patient._id" :label="patient.patientName" :value="patient._id" />
        </el-select>
        <el-dropdown @command="handleMenuCommand">
          <el-button text class="settings-btn" aria-label="设置">
            <el-icon>
              <Setting />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="patient">就诊人管理</el-dropdown-item>
              <el-dropdown-item command="records">病例管理</el-dropdown-item>
              <el-dropdown-item command="chatHistory">交流历史</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="chat-main">
      <section v-if="messages.length > 0" class="messages-panel">
        <div class="messages-scroll">
          <div v-for="(msg, idx) in messages" :key="idx" :class="['message', msg.type]">
            <div class="message-bubble">
              <div class="message-content" v-html="renderMessage(msg)"></div>
            </div>
          </div>
        </div>
      </section>

      <div v-if="messages.length === 0" class="welcome-section">
        <h2 class="welcome-title">我来帮您分析病例</h2>
        <p class="welcome-subtitle">上传病例 · 询问病例信息 · 整合和分析</p>
      </div>

      <section class="composer-card">
        <el-input v-model="inputMessage" type="textarea" class="composer-input" placeholder="描述你的问题或需求..." :rows="4"
          @keydown.enter.exact.prevent="sendMessage" />

        <div class="composer-footer">
          <div class="footer-left">
            <span class="helper-text">Enter 发送，Shift+Enter 换行</span>
          </div>
          <div class="footer-actions">
            <el-button link type="primary" class="upload-link" @click="uploadDialogRef?.open()">
              上传病例
            </el-button>
            <el-button type="primary" class="send-btn" @click="sendMessage">发送</el-button>
          </div>
        </div>
      </section>
    </main>

    <!-- 就诊人管理组件 -->
    <patient-manager v-model="showPatientManageDialog" @patient-added="handlePatientAdded"
      @patient-updated="handlePatientUpdated" @patient-deleted="handlePatientDeleted" />

    <!-- 交流历史组件 -->
    <chat-history ref="chatHistoryRef" v-model="showChatHistoryDialog" :user-id="userStore.userId"
      :current-patient-id="currentPatientId" />

    <!-- 病例管理组件 -->
    <medical-record-manager ref="recordManagerRef" v-model="showRecordManageDialog" :user-id="userStore.userId"
      :current-patient-id="currentPatientId" @record-uploaded="handleRecordUploaded"
      @record-deleted="handleRecordDeleted" />

    <!-- 上传病例对话框 -->
    <upload-record-dialog ref="uploadDialogRef" v-model="showUploadDialog" :user-id="userStore.userId"
      :patient-id="currentPatientId" @upload-success="handleUploadSuccess" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/userStore";
import { usePatientStore } from "../stores/patientStore";
import { patientAPI, chatAPI } from "../services/api";
import { ElMessage } from "element-plus";
import { Setting } from "@element-plus/icons-vue";
import PatientManager from "../components/PatientManager.vue";
import ChatHistory from "../components/ChatHistory.vue";
import MedicalRecordManager from "../components/MedicalRecordManager.vue";
import UploadRecordDialog from "../components/UploadRecordDialog.vue";

const router = useRouter();
const userStore = useUserStore();
const patientStore = usePatientStore();

const patients = computed(() => patientStore.patients);
const currentPatientId = computed({
  get: () => patientStore.currentPatientId,
  set: (value) => patientStore.setCurrentPatient(value),
});

const inputMessage = ref("");
const messages = ref([]);
const showPatientManageDialog = ref(false);
const showChatHistoryDialog = ref(false);
const showRecordManageDialog = ref(false);
const showUploadDialog = ref(false);
const chatHistoryRef = ref(null);
const recordManagerRef = ref(null);
const uploadDialogRef = ref(null);

onMounted(async () => {
  // 禁用窗口滚动，仅在 Chat 页面
  document.documentElement.classList.add("no-scroll");
  document.body.classList.add("no-scroll");

  // 获取就诊人列表
  try {
    const response = await patientAPI.getPatients(userStore.userId);
    patientStore.setPatients(response.data.data);

    if (response.data.data.length > 0) {
      patientStore.setCurrentPatient(response.data.data[0]._id);
    }
  } catch (error) {
    ElMessage.error("获取就诊人列表失败");
  }
});

onBeforeUnmount(() => {
  document.documentElement.classList.remove("no-scroll");
  document.body.classList.remove("no-scroll");
});

const md = new MarkdownIt({
  linkify: true,
  breaks: true,
});

const renderMarkdown = (text) => DOMPurify.sanitize(md.render(text || ""));

const renderMessage = (msg) => {
  if (!msg || msg.loading) return "正在思考中...";
  if (msg.error) return renderMarkdown(`**错误：** ${msg.content || ""}`);
  return renderMarkdown(msg.content || "");
};

const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    return;
  }

  if (!currentPatientId.value) {
    ElMessage.warning("请先选择就诊人");
    return;
  }

  const userMessage = inputMessage.value;
  inputMessage.value = "";

  // 添加用户消息
  messages.value.push({
    type: "user",
    content: userMessage,
  });

  // 添加加载状态
  const loadingMsg = {
    type: "ai",
    content: "正在思考中...",
    loading: true,
  };
  messages.value.push(loadingMsg);

  try {
    // 调用后端 AI 分析 API
    const response = await chatAPI.sendMessage({
      userId: userStore.userId,
      patientId: currentPatientId.value,
      message: userMessage,
    });

    // 移除加载消息
    messages.value.pop();

    // 添加 AI 回复
    messages.value.push({
      type: "ai",
      content: response.data.data.aiReply,
    });
  } catch (error) {
    // 移除加载消息
    messages.value.pop();

    // 显示错误消息
    messages.value.push({
      type: "ai",
      content: `抱歉，AI 回复失败: ${error.message || "未知错误"}`,
      error: true,
    });

    ElMessage.error("AI 回复失败");
  }
};

const handleMenuCommand = (command) => {
  if (command === "patient") {
    showPatientManageDialog.value = true;
  } else if (command === "records") {
    recordManagerRef.value?.open();
  } else if (command === "chatHistory") {
    chatHistoryRef.value?.open();
  } else if (command === "logout") {
    handleLogout();
  }
};

const handleLogout = () => {
  userStore.logout();
  router.push("/login");
};

const handlePatientAdded = (patient) => {
  // 患者添加成功后的处理
  if (patients.value.length === 1) {
    // 如果这是第一个患者，自动选中
    patientStore.setCurrentPatient(patient._id);
  }
};

const handlePatientUpdated = (patientData) => {
  // 患者更新成功后的处理
};

const handlePatientDeleted = (patientId) => {
  // 患者删除成功后的处理
  if (currentPatientId.value === patientId && patients.value.length > 0) {
    patientStore.setCurrentPatient(patients.value[0]._id);
  }
};

const handleRecordUploaded = () => {
};

const handleUploadSuccess = () => {
  // 添加AI响应消息
  messages.value.push({
    type: "ai",
    content: "我已收到病例，请提问...",
  });
};

const handleRecordDeleted = (recordId) => {
  // 病例删除成功后的处理
};
</script>

<style scoped>
.chat-page {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0px;
  background: var(--bg-primary, #0b0e14);
  color: var(--text-primary, #e7eaf0);
  overflow: hidden;
}

.bg-spotlight {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.chat-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #1f2733;
  color: #9fb5ff;
  display: grid;
  place-items: center;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-kicker {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #e9ecf5;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-btn {
  color: #cfd5e3;
  padding: 6px 8px;
  min-width: 36px;
  justify-content: center;
}

.compact-select {
  min-width: 90px;
}

.welcome-section {
  text-align: center;
  margin-bottom: 24px;
}

.welcome-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #e9ecf5;
  letter-spacing: 0.3px;
}

.welcome-subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: #9ca3af;
  letter-spacing: 0.2px;
}

.chat-main {
  position: relative;
  z-index: 1;
  margin-top: 18px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
  min-height: 0;
  overflow: auto;
  -ms-overflow-style: none;
  scrollbar-width: thin;
}

.messages-panel {
  flex: 1;
  width: 100%;
  max-width: 840px;
  margin-top: -18px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.messages-scroll {
  padding: 20px;
  flex: 1;
  padding-bottom: 190px;
}

.messages-scroll::-webkit-scrollbar {
  width: 8px;
}

.messages-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.empty-title {
  margin: 0;
  font-size: 18px;
  color: #e9ecf5;
}

.empty-sub {
  margin: 6px 0 0;
  font-size: 13px;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  align-items: flex-start;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #1f2733;
  color: #9fb5ff;
  display: grid;
  place-items: center;
  font-weight: 600;
  flex-shrink: 0;
}

.message-bubble {
  max-width: 80%;
  /* background: #1a1f29;
  border: 1px solid #242c38; */
  border-radius: 14px;
  padding: 12px 14px;
  /* box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25); */
}

.message.user .message-bubble {
  background: #1d4ed8;
  border-color: #1d4ed8;
  color: #f6f8ff;
}

.message-content {
  color: #e5e7eb;
  line-height: 1.6;
  word-break: break-word;
}

.message.user .message-content {
  color: #f6f8ff;
}

.message-content :deep(p) {
  margin: 0 0 8px;
}

.message-content :deep(p:last-child) {
  margin-bottom: 0;
}

.message-content :deep(code) {
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 5px;
  border-radius: 6px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.message-content :deep(pre) {
  background: #0b0f14;
  color: #f8f8f8;
  padding: 10px;
  border-radius: 10px;
  overflow-x: auto;
  margin: 8px 0;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  padding-left: 20px;
  margin: 6px 0;
}

.message-content :deep(a) {
  color: #3b82f6;
  word-break: break-all;
}

.composer-card {
  padding: 16px;
  width: 100%;
  max-width: 840px;
  position: fixed;
  bottom: 0;
  background: var(--bg-primary, #0b0e14);
}

.composer-input :deep(.el-textarea__inner) {
  background: #0f131a;
  color: #e5e7eb;
  border: 1px solid #242c38;
  border-radius: 12px;
  padding: 12px;
}

.composer-input :deep(.el-textarea__inner:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.35);
}

.composer-input :deep(.el-textarea__inner::placeholder) {
  color: #6b7280;
}

.composer-footer {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.helper-text {
  color: #9ca3af;
  font-size: 12px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.upload-link {
  color: #9ca3af;
  padding-left: 0;
}

.send-btn {
  min-width: 96px;
  border-radius: 12px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .chat-page {
    padding: 0;
  }

  .chat-header {
    padding: 12px 12px;
    gap: 12px;
  }

  .brand {
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .brand-logo {
    width: 32px;
    height: 32px;
    font-size: 12px;
    border-radius: 8px;
  }

  .brand-kicker {
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-actions {
    gap: 6px;
  }

  .compact-select {
    max-width: 120px;
  }

  .settings-btn {
    padding: 4px 6px;
    min-width: 32px;
  }

  .chat-main {
    padding: 12px;
    gap: 16px;
  }

  .messages-panel {
    border-radius: 12px;
  }

  .message-bubble {
    max-width: 85%;
    padding: 10px 12px;
    font-size: 14px;
    border-radius: 12px;
  }

  .welcome-section {
    padding: 24px 16px;
  }

  .welcome-title {
    font-size: 20px;
  }

  .welcome-subtitle {
    font-size: 13px;
  }

  .composer-card {
    padding: 12px;
    border-radius: 12px;
  }

  .composer-input :deep(.el-textarea__inner) {
    font-size: 15px;
    min-height: 80px !important;
  }

  .composer-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .footer-left {
    order: 2;
    text-align: center;
  }

  .helper-text {
    font-size: 11px;
    display: none;
  }

  .footer-actions {
    order: 1;
    justify-content: stretch;
    gap: 8px;
  }

  .upload-link {
    flex: 1;
    justify-content: center;
  }

  .send-btn {
    flex: 1;
    min-width: auto;
  }
}

/* 小屏手机适配 */
@media (max-width: 375px) {
  .chat-header {
    padding: 10px 10px;
  }

  .brand-kicker {
    font-size: 13px;
  }

  .compact-select {
    max-width: 100px;
  }

  .chat-main {
    padding: 10px;
  }

  .message-bubble {
    max-width: 90%;
    font-size: 13px;
  }

  .welcome-title {
    font-size: 18px;
  }

  .composer-card {
    padding: 10px;
  }
}

/* 横屏手机适配 */
@media (max-width: 768px) and (orientation: landscape) {
  .welcome-section {
    padding: 16px;
  }

  .welcome-title {
    font-size: 18px;
    margin-bottom: 8px;
  }

  .composer-input :deep(.el-textarea__inner) {
    min-height: 60px !important;
  }
}
</style>

<style>
/* 非 scoped：禁用窗口滚动，仅在 Chat 页面挂载时生效 */
html.no-scroll,
body.no-scroll {
  height: 100%;
  overflow: hidden;
}

/* 对话框表单 label 右侧对齐 */
.el-dialog :deep(.el-form-item__label) {
  text-align: right;
}

/* 对话框日期选择器全宽 */
.el-dialog :deep(.el-date-editor) {
  width: 100%;
}
</style>
