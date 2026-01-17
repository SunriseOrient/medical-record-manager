<template>
  <div>
    <!-- 病例管理对话框 -->
    <el-dialog v-model="showDialog" title="病例管理" width="900px" :close-on-click-modal="false" :fullscreen="isMobile">
      <div class="medical-record-container">
        <div class="record-header">
          <el-button type="primary" @click="openUploadDialog">上传病例</el-button>
        </div>
        <el-table :data="records" stripe :loading="loading" empty-text="暂无病例">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="检查时间" width="100" align="center">
            <template #default="{ row }">
              {{ formatDate(row.checkTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="recordType" label="病例类型" width="100" align="center" />
          <el-table-column label="文件名" align="center" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.originalFileName || row.fileName }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewRecord(row)">
                查看详情
              </el-button>
              <el-button link type="warning" size="small" @click="openEditDialog(row)">
                编辑
              </el-button>
              <el-button link type="success" size="small" @click="viewSourceFileDirectly(row)">
                查看源文件
              </el-button>
              <el-button link type="danger" size="small" @click="deleteRecord(row._id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="showDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 上传病例对话框 -->
    <upload-record-dialog ref="uploadDialogRef" v-model="showUploadDialog" :user-id="props.userId"
      :patient-id="props.currentPatientId" @upload-success="handleUploadSuccess" />

    <!-- 病例详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="病例详情" width="700px" :fullscreen="isMobile">
      <div v-if="currentRecord">
        <div class="detail-row">
          <span class="detail-label">病例类型：</span>
          <span>{{ currentRecord.recordType }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">检查时间：</span>
          <span>{{ formatDate(currentRecord.checkTime) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">文件名：</span>
          <span>{{
            currentRecord.originalFileName || currentRecord.fileName
          }}</span>
        </div>
        <div class="detail-section">
          <div class="detail-label">OCR 提取文本：</div>
          <el-input v-model="currentRecord.extractedText" type="textarea" :autosize="{ minRows: 6, maxRows: 12 }"
            readonly class="ocr-text" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑病例对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑病例" width="700px" :fullscreen="isMobile">
      <el-form :model="editForm" label-position="top">
        <el-form-item label="病例类型" required>
          <el-select v-model="editForm.recordType" placeholder="选择类型" style="width: 100%">
            <el-option label="化验单" value="化验单" />
            <el-option label="影像报告" value="影像报告" />
            <el-option label="检查报告" value="检查报告" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="检查日期" required>
          <el-date-picker v-model="editForm.checkTime" type="date" placeholder="选择检查日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="OCR 提取文本">
          <el-input v-model="editForm.extractedText" type="textarea" :autosize="{ minRows: 6, maxRows: 12 }"
            placeholder="编辑 OCR 文本" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="saveEditLoading" @click="submitEdit">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 源文件预览对话框 -->
    <el-dialog v-model="showFilePreviewDialog" fullscreen title="源文件预览" :close-on-click-modal="false">
      <div class="file-preview-container">
        <div v-if="isImageFile" class="image-preview">
          <!-- 图片控制工具栏 -->
          <div class="image-toolbar">
            <el-button circle @click="handleZoomIn" :icon="ZoomIn"></el-button>
            <el-button circle @click="handleZoomOut" :icon="ZoomOut"></el-button>
            <el-button circle @click="handleRotateLeft" :icon="RefreshLeft"></el-button>
            <el-button circle @click="handleRotateRight" :icon="RefreshRight"></el-button>
            <el-button circle @click="handleResetTransform" :icon="Refresh"></el-button>
            <span class="zoom-info">{{ Math.round(imageTransform.scale * 100) }}%</span>
          </div>
          <!-- 图片显示区域 -->
          <div class="image-wrapper">
            <img :src="filePreviewUrl" alt="病例图片" class="preview-image" :style="{
              transform: `scale(${imageTransform.scale}) rotate(${imageTransform.rotate}deg)`,
              transition: 'transform 0.3s ease',
            }" />
          </div>
        </div>
        <div v-else-if="isPdfFile" class="pdf-preview">
          <div class="pdf-toolbar">
            <el-button :disabled="pdfCurrentPage === 1" @click="pdfCurrentPage--" :icon="ArrowLeft" circle></el-button>
            <span class="pdf-page-info">{{ pdfCurrentPage }} / {{ pdfTotalPages }}</span>
            <el-button :disabled="pdfCurrentPage >= pdfTotalPages" @click="pdfCurrentPage++" :icon="ArrowRight"
              circle></el-button>
            <el-divider direction="vertical"></el-divider>
            <el-button @click="handlePdfZoomOut" :icon="ZoomOut" circle></el-button>
            <span class="pdf-zoom-info">{{ Math.round(pdfScale * 100) }}%</span>
            <el-button @click="handlePdfZoomIn" :icon="ZoomIn" circle></el-button>
            <el-button @click="handlePdfReset" :icon="Refresh" circle title="重置缩放与旋转"></el-button>
            <el-divider direction="vertical"></el-divider>
            <el-button @click="handlePdfRotateLeft" :icon="RefreshLeft" circle title="左旋90°"></el-button>
            <span class="pdf-zoom-info">{{ pdfRotation }}°</span>
            <el-button @click="handlePdfRotateRight" :icon="RefreshRight" circle title="右旋90°"></el-button>
          </div>
          <div class="pdf-content" ref="pdfContentRef" @mousedown="startDrag" @wheel.prevent="handleWheel">
            <vue-pdf-embed :source="filePreviewUrl" :page="pdfCurrentPage" :width="pdfPageWidth * pdfScale"
              :rotation="pdfRotation" @loaded="handlePdfLoaded" class="pdf-viewer"
              :style="{ cursor: isDragging ? 'grabbing' : 'grab' }" />
          </div>
        </div>
        <div v-else class="unsupported-preview">
          <p>不支持预览此文件类型</p>
          <el-button type="primary" @click="downloadFile">下载文件</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="showFilePreviewDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { medicalRecordAPI } from "../services/api";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ZoomIn,
  ZoomOut,
  RefreshLeft,
  RefreshRight,
  Refresh,
  ArrowLeft,
  ArrowRight,
} from "@element-plus/icons-vue";
import VuePdfEmbed from "vue-pdf-embed";
import UploadRecordDialog from "./UploadRecordDialog.vue";
import { formatDateYMDLocal } from "../utils/date";

// 移动端检测
const isMobile = ref(window.innerWidth <= 768);
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});

// Props 和 Emits
const props = defineProps({
  modelValue: Boolean,
  userId: String,
  currentPatientId: String,
});

const emit = defineEmits([
  "update:modelValue",
  "record-uploaded",
  "record-deleted",
]);

// 对话框状态
const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const showUploadDialog = ref(false);
const showDetailDialog = ref(false);
const showFilePreviewDialog = ref(false);
const showEditDialog = ref(false);
const loading = ref(false);

const saveEditLoading = ref(false);
const records = ref([]);
const currentRecord = ref(null);
const filePreviewUrl = ref("");
const uploadDialogRef = ref(null);

const editForm = ref({
  _id: "",
  recordType: "",
  checkTime: null,
  extractedText: "",
});

// 图片预览控制
const imageTransform = ref({
  scale: 1,
  rotate: 0,
});

// PDF预览控制
const pdfCurrentPage = ref(1);
const pdfTotalPages = ref(0);
const pdfScale = ref(1);
const pdfRotation = ref(0);
const pdfPageWidth = ref(800); // 默认页面宽度
const pdfContentRef = ref(null);
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const scrollStart = ref({ left: 0, top: 0 });

// 工具方法
const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("zh-CN");
};

// 使用公共日期工具：formatDateYMDLocal

const buildFileUrl = (recordId) => {
  return `/medical-record-manager-server/api/medical-records/preview/${recordId}`;
};

// 业务逻辑方法
const loadRecords = async () => {
  if (!props.currentPatientId) {
    ElMessage.warning("请先选择就诊人");
    return;
  }

  try {
    loading.value = true;
    const response = await medicalRecordAPI.getRecords(props.currentPatientId);
    records.value = response.data.data.records || [];
  } catch (error) {
    ElMessage.error("加载病例列表失败");
    console.error("加载病例列表出错:", error);
  } finally {
    loading.value = false;
  }
};

const openUploadDialog = () => {
  uploadDialogRef.value?.open();
};

const handleUploadSuccess = async () => {
  await loadRecords();
  emit("record-uploaded");
};

const viewRecord = (record) => {
  currentRecord.value = { ...record };
  showDetailDialog.value = true;
};

const isImageFile = computed(() => {
  if (!currentRecord.value?.fileName) return false;
  const ext = currentRecord.value.fileName.toLowerCase().split(".").pop();
  return ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext);
});

const isPdfFile = computed(() => {
  if (!currentRecord.value?.fileName) return false;
  const ext = currentRecord.value.fileName.toLowerCase().split(".").pop();
  return ext === "pdf";
});

const viewSourceFileDirectly = async (record) => {
  if (!record?._id) {
    ElMessage.error("记录ID不存在");
    return;
  }

  try {
    currentRecord.value = { ...record };
    
    // 从后端预览接口获取文件
    const response = await medicalRecordAPI.getFilePreview(record._id);
    
    // 将 arraybuffer 转换为 Blob URL
    const blob = new Blob([response.data], {
      type: response.headers["content-type"] || "application/octet-stream",
    });
    filePreviewUrl.value = URL.createObjectURL(blob);

    // 重置图片变换状态
    resetImageTransform();

    // 如果是PDF文件，重置PDF状态
    if (isPdfFile.value) {
      pdfCurrentPage.value = 1;
      pdfTotalPages.value = 0;
      pdfScale.value = 1;
      pdfRotation.value = 0;
    }

    showFilePreviewDialog.value = true;
  } catch (error) {
    ElMessage.error("加载文件预览失败");
    console.error("加载文件预览出错:", error);
  }
};

// PDF加载完成处理
const handlePdfLoaded = (pdf) => {
  pdfTotalPages.value = pdf.numPages;
  // 获取第一页以确定页面宽度
  pdf.getPage(1).then((page) => {
    const viewport = page.getViewport({ scale: 1 });
    const containerWidth = (() => {
      if (!pdfContentRef.value) return viewport.width;
      const styles = getComputedStyle(pdfContentRef.value);
      const paddingLeft = parseFloat(styles.paddingLeft) || 0;
      const paddingRight = parseFloat(styles.paddingRight) || 0;
      const innerWidth =
        pdfContentRef.value.clientWidth - paddingLeft - paddingRight;
      return innerWidth > 0 ? innerWidth : viewport.width;
    })();
    pdfPageWidth.value = isMobile.value ? containerWidth : viewport.width;
    console.log(
      "PDF已加载，总页数:",
      pdfTotalPages.value,
      "页面宽度:",
      pdfPageWidth.value
    );
    centerPdfScroll();
  });
};

// 居中滚动到内容中点
const centerPdfScroll = () => {
  if (!pdfContentRef.value) return;
  requestAnimationFrame(() => {
    const el = pdfContentRef.value;
    const centerX = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
    el.scrollLeft = centerX;
  });
};

// PDF缩放控制
const handlePdfZoomIn = () => {
  pdfScale.value = Math.min(pdfScale.value + 0.5, 5);
  centerPdfScroll();
};

const handlePdfZoomOut = () => {
  pdfScale.value = Math.max(pdfScale.value - 0.5, 0.5);
  centerPdfScroll();
};

const handlePdfRotateLeft = () => {
  pdfRotation.value = (pdfRotation.value + 270) % 360;
};

const handlePdfRotateRight = () => {
  pdfRotation.value = (pdfRotation.value + 90) % 360;
};

const handlePdfReset = () => {
  pdfScale.value = 1;
  pdfRotation.value = 0;
  if (pdfContentRef.value) {
    pdfContentRef.value.scrollTo({ top: 0, left: 0 });
    centerPdfScroll();
  }
};

// 鼠标滚轮缩放
const handleWheel = (e) => {
  if (e.ctrlKey || e.metaKey) {
    // Ctrl/Cmd + 滚轮缩放
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    pdfScale.value = Math.max(0.5, Math.min(5, pdfScale.value + delta));
    centerPdfScroll();
  }
};

// PDF拖拽功能
const startDrag = (e) => {
  if (e.button !== 0) return; // 只响应左键
  isDragging.value = true;
  dragStart.value = { x: e.clientX, y: e.clientY };
  scrollStart.value = {
    left: pdfContentRef.value.scrollLeft,
    top: pdfContentRef.value.scrollTop,
  };

  const onMouseMove = (moveEvent) => {
    if (!isDragging.value) return;
    const dx = moveEvent.clientX - dragStart.value.x;
    const dy = moveEvent.clientY - dragStart.value.y;
    pdfContentRef.value.scrollLeft = scrollStart.value.left - dx;
    pdfContentRef.value.scrollTop = scrollStart.value.top - dy;
  };

  const onMouseUp = () => {
    isDragging.value = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

// 图片控制函数
const handleZoomIn = () => {
  imageTransform.value.scale = Math.min(imageTransform.value.scale + 0.2, 5);
};

const handleZoomOut = () => {
  imageTransform.value.scale = Math.max(imageTransform.value.scale - 0.2, 0.2);
};

const handleRotateLeft = () => {
  imageTransform.value.rotate -= 90;
};

const handleRotateRight = () => {
  imageTransform.value.rotate += 90;
};

const handleResetTransform = () => {
  resetImageTransform();
};

const resetImageTransform = () => {
  imageTransform.value = {
    scale: 1,
    rotate: 0,
  };
};

const downloadFile = () => {
  if (!currentRecord.value?._id) return;
  const link = document.createElement("a");
  link.href = buildFileUrl(currentRecord.value._id);
  link.download =
    currentRecord.value.originalFileName ||
    currentRecord.value.fileName ||
    "file";
  link.click();
};

const openEditDialog = (record) => {
  editForm.value = {
    _id: record._id,
    recordType: record.recordType,
    checkTime: record.checkTime ? new Date(record.checkTime) : null,
    extractedText: record.extractedText || "",
  };
  showEditDialog.value = true;
};

const submitEdit = async () => {
  if (!editForm.value._id) return;
  if (!editForm.value.recordType || !editForm.value.checkTime) {
    ElMessage.warning("请填写必填项: 病例类型、检查时间");
    return;
  }
  try {
    saveEditLoading.value = true;
    const payload = {
      recordType: editForm.value.recordType,
      checkTime:
        editForm.value.checkTime instanceof Date
          ? formatDateYMDLocal(editForm.value.checkTime)
          : editForm.value.checkTime,
      extractedText: editForm.value.extractedText || "",
    };
    await medicalRecordAPI.updateRecord(editForm.value._id, payload);
    ElMessage.success("保存成功");
    showEditDialog.value = false;
    // 更新列表记录
    const idx = records.value.findIndex((r) => r._id === editForm.value._id);
    if (idx !== -1) {
      records.value[idx] = {
        ...records.value[idx],
        ...payload,
        checkTime: payload.checkTime,
      };
    }
    // 若详情正在查看，同步更新
    if (currentRecord.value && currentRecord.value._id === editForm.value._id) {
      currentRecord.value = {
        ...currentRecord.value,
        ...payload,
      };
    }
  } catch (error) {
    ElMessage.error("保存失败");
    console.error("保存编辑出错:", error);
  } finally {
    saveEditLoading.value = false;
  }
};

const deleteRecord = async (recordId) => {
  ElMessageBox.confirm("确定删除该病例吗？此操作不可恢复。", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        await medicalRecordAPI.deleteRecord(recordId);
        ElMessage.success("病例删除成功");
        await loadRecords();
        emit("record-deleted", recordId);
      } catch (error) {
        ElMessage.error("删除病例失败");
        console.error("删除病例出错:", error);
      }
    })
    .catch(() => { });
};

// 暴露给父组件调用
const open = () => {
  loadRecords();
  showDialog.value = true;
};

defineExpose({
  open,
  loadRecords,
});
</script>

<style scoped>
.medical-record-container {
  padding: 20px;
}

.record-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.detail-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  align-items: center;
}

.detail-section {
  margin-top: 20px;
}

.detail-label {
  font-weight: 600;
  color: #e5e7eb;
  min-width: 100px;
}

.ocr-text {
  margin-top: 10px;
}

.file-preview-container {
  width: 100%;
  height: 85vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.image-toolbar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 15px;
}

.image-toolbar :deep(.el-button) {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: #e5e7eb;
  margin: 0;
}

.image-toolbar :deep(.el-button:hover) {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: #ffffff;
}

.image-toolbar :deep(.el-icon) {
  color: #e5e7eb !important;
}

.image-toolbar :deep(.el-button:hover .el-icon) {
  color: #ffffff !important;
}

.zoom-info {
  color: #e5e7eb;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.image-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.pdf-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-toolbar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(180deg,
      rgba(0, 0, 0, 0.8) 0%,
      rgba(0, 0, 0, 0.4) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
}

.pdf-toolbar :deep(.el-button) {
  background-color: rgba(59, 130, 246, 0.2) !important;
  border-color: rgba(59, 130, 246, 0.3) !important;
  color: #60a5fa !important;
}

.pdf-toolbar :deep(.el-button:hover:not(:disabled)) {
  background-color: rgba(59, 130, 246, 0.4) !important;
  border-color: rgba(59, 130, 246, 0.5) !important;
  color: #93c5fd !important;
}

.pdf-toolbar :deep(.el-button:disabled) {
  opacity: 0.5;
}

.pdf-page-info,
.pdf-zoom-info {
  color: #e5e7eb;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  padding: 4px 0px;
}

.pdf-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #e5e7eb;
  font-size: 16px;
}

.pdf-loading :deep(.el-icon) {
  font-size: 48px;
  margin-bottom: 16px;
}

.pdf-content {
  flex: 1;
  overflow: auto;
  background: #0b0f14;
  padding: 20px;
  user-select: none;
  text-align: center;
}

.pdf-viewer {
  display: inline-block;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.pdf-canvas {
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  transform-origin: center;
  transition: transform 0.3s ease;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.unsupported-preview {
  text-align: center;
  color: #9ca3af;
}

.unsupported-preview p {
  margin-bottom: 20px;
  font-size: 16px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .medical-record-container {
    padding: 12px;
  }

  .record-header {
    margin-bottom: 16px;
  }

  :deep(.el-table) {
    font-size: 13px;
  }

  :deep(.el-table th),
  :deep(.el-table td) {
    padding: 8px 4px;
  }

  :deep(.el-button--small) {
    padding: 4px 6px;
    font-size: 12px;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 10px;
  }

  .detail-label {
    min-width: auto;
    font-size: 13px;
  }

  .detail-section {
    margin-top: 16px;
  }

  .image-toolbar {
    padding: 12px 10px;
  }

  .image-toolbar :deep(.el-button) {
    padding: 6px 10px;
    font-size: 13px;
  }

  .zoom-info {
    font-size: 13px;
  }

  .pdf-toolbar {
    padding: 10px 8px;
    gap: 8px;
  }

  .pdf-toolbar :deep(.el-button) {
    width: 36px;
    height: 36px;
    padding: 0 !important;
  }

  .pdf-page-info,
  .pdf-zoom-info {
    font-size: 12px;
    padding: 4px 0px;
  }

  .pdf-content {
    padding: 12px;
  }

  .pdf-canvas {
    max-width: 100%;
  }

  .file-preview-container {
    height: 70vh;
  }
}
</style>
