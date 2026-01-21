<template>
  <el-dialog v-model="visible" title="上传病例" width="600px" :close-on-click-modal="false" :fullscreen="isMobile">
    <el-form :model="form" label-position="top">
      <el-form-item label="病例类型" required>
        <el-select v-model="form.recordType" placeholder="选择类型" style="width: 100%">
          <el-option label="化验单" value="化验单" />
          <el-option label="影像报告" value="影像报告" />
          <el-option label="检查报告" value="检查报告" />
          <el-option label="其他" value="其他" />
        </el-select>
      </el-form-item>

      <el-form-item label="检查日期" required>
        <el-date-picker v-model="form.checkTime" type="date" placeholder="选择检查日期" style="width: 100%" />
      </el-form-item>

      <el-form-item label="选择文件" required>
        <div style="overflow: hidden;width: 100%;">
          <el-upload ref="upload" :auto-upload="false" :multiple="true" :limit="20" :on-exceed="handleExceed"
            :on-change="onFileChange" :http-request="noopRequest" :file-list="fileList" accept=".jpg,.jpeg,.png,.pdf">
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持批量上传图片或 PDF 文件（最多20个）</div>
            </template>
          </el-upload>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="uploadLoading" @click="submit">上传</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { medicalRecordAPI } from '../services/api'
import { formatDateYMDLocal } from '../utils/date'

// 移动端检测
const isMobile = ref(window.innerWidth <= 768)
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

// Props & Emits
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  userId: { type: String, required: true },
  patientId: { type: String, required: false },
})

const emit = defineEmits(['update:modelValue', 'upload-success'])
const upload = ref()

// Dialog visible two-way binding
const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})


// Form state
const form = ref({
  recordType: '',
  checkTime: null,
})
const fileList = ref([])
const uploadLoading = ref(false)

const noopRequest = () => Promise.resolve()

const handleExceed = (files) => {
  ElMessage.warning('最多只能选择20个文件')
}

const reset = () => {
  form.value = {
    recordType: '',
    checkTime: null,
  }
  fileList.value = []
  upload.value?.clearFiles()
}

const close = () => {
  visible.value = false
  reset()
}


const onFileChange = (file, fileList_) => {
  fileList.value = fileList_.map(f => f)
}


const submit = async () => {
  if (!props.patientId) {
    ElMessage.warning('请先选择就诊人')
    return
  }
  if (!fileList.value.length || !form.value.recordType || !form.value.checkTime) {
    ElMessage.warning('请填写所有必填项并选择文件')
    return
  }

  try {
    uploadLoading.value = true
    const fd = new FormData()
    fileList.value.forEach(f => {
      fd.append('file', f.raw)
    })
    fd.append('userId', props.userId)
    fd.append('patientId', props.patientId)
    const dateStr = form.value.checkTime instanceof Date
      ? formatDateYMDLocal(form.value.checkTime)
      : String(form.value.checkTime)
    fd.append('checkTime', dateStr)
    fd.append('recordType', form.value.recordType)

    const resp = await medicalRecordAPI.uploadRecord(fd)
    if (resp?.data?.success) {
      ElMessage.success('病例上传成功')
      emit('upload-success', resp?.data?.data ?? null)
      close()
    } else {
      ElMessage.error(resp?.data?.message || '病例上传失败')
    }
  } catch (err) {
    ElMessage.error('病例上传失败')
    console.error('上传病例出错:', err)
  } finally {
    uploadLoading.value = false
  }
}

// Expose open() for parent to trigger dialog imperatively
const open = () => {
  reset()
  visible.value = true
}

defineExpose({ open })
</script>

<style scoped>
.file-name {
  margin-top: 8px;
  color: #9ca3af;
}

/* 移动端适配 */
@media (max-width: 768px) {

  :deep(.el-form-item__label) {
    font-size: 14px;
  }

  :deep(.el-input__inner),
  :deep(.el-textarea__inner) {
    font-size: 15px;
  }

  :deep(.el-button) {
    min-height: 40px;
    font-size: 14px;
  }

  :deep(.el-upload__tip) {
    font-size: 12px;
  }
}
</style>
