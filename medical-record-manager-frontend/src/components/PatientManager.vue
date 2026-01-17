<template>
  <!-- 添加就诊人对话框 -->
  <el-dialog v-model="showPatientDialog" title="添加就诊人" width="400px" :fullscreen="isMobile">
    <el-form :model="patientForm" label-position="top">
      <el-form-item label="姓名" required>
        <el-input v-model="patientForm.patientName" placeholder="请输入姓名" />
      </el-form-item>
      <el-form-item label="出生日期" required>
        <el-date-picker style="width: 100%;" v-model="patientForm.birthDate" type="date" placeholder="请选择出生日期" />
      </el-form-item>
      <el-form-item label="性别" required>
        <el-select v-model="patientForm.gender" placeholder="请选择性别">
          <el-option label="男" value="male" />
          <el-option label="女" value="female" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="closeAddDialog">取消</el-button>
      <el-button type="primary" @click="addPatient">确定</el-button>
    </template>
  </el-dialog>

  <!-- 就诊人管理对话框 -->
  <el-dialog v-model="showPatientManageDialog" title="就诊人管理" width="600px" :close-on-click-modal="false"
    :fullscreen="isMobile">
    <div class="patient-manage-container">
      <div class="patient-manage-header">
        <el-button type="primary" @click="openAddPatientForm">添加</el-button>
      </div>
      <el-table :data="patients" stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="patientName" label="姓名" align="center" />
        <el-table-column label="出生日期" align="center" width="110">
          <template #default="{ row }">
            {{ formatDate(row.birthDate) }}
          </template>
        </el-table-column>
        <el-table-column label="性别" align="center">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : row.gender === 'female' ? '女' : '其他' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="185" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewPatient(row)">
              查看
            </el-button>
            <el-button link type="warning" size="small" @click="editPatient(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="deletePatient(row._id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <template #footer>
      <el-button @click="showPatientManageDialog = false">关闭</el-button>
    </template>
  </el-dialog>

  <!-- 患者详情查看对话框 -->
  <el-dialog v-model="showPatientDetailDialog" title="就诊人详情" width="500px" :fullscreen="isMobile">
    <div v-if="currentPatientDetail">
      <div class="detail-row">
        <span class="detail-label">姓名：</span>
        <span>{{ currentPatientDetail.patientName }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">出生日期：</span>
        <span>{{ formatDate(currentPatientDetail.birthDate) }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">性别：</span>
        <span>{{
          currentPatientDetail.gender === 'male'
            ? '男'
            : currentPatientDetail.gender === 'female'
              ? '女'
              : '其他'
        }}</span>
      </div>
    </div>
    <template #footer>
      <el-button @click="showPatientDetailDialog = false">关闭</el-button>
    </template>
  </el-dialog>

  <!-- 编辑患者对话框 -->
  <el-dialog v-model="showEditPatientDialog" title="编辑就诊人" width="400px" :fullscreen="isMobile">
    <el-form :model="editPatientForm" label-position="top">
      <el-form-item label="姓名" required>
        <el-input v-model="editPatientForm.patientName" placeholder="请输入姓名" />
      </el-form-item>
      <el-form-item label="出生日期" required>
        <el-date-picker v-model="editPatientForm.birthDate" type="date" placeholder="请选择出生日期" />
      </el-form-item>
      <el-form-item label="性别" required>
        <el-select v-model="editPatientForm.gender" placeholder="请选择性别">
          <el-option label="男" value="male" />
          <el-option label="女" value="female" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showEditPatientDialog = false">取消</el-button>
      <el-button type="primary" @click="submitEditPatient">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { patientAPI } from "../services/api";
import { ElMessage, ElMessageBox } from "element-plus";
import { useUserStore } from "../stores/userStore";
import { usePatientStore } from "../stores/patientStore";

const userStore = useUserStore();
const patientStore = usePatientStore();

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
});

const emit = defineEmits(["update:modelValue", "patient-added", "patient-updated", "patient-deleted"]);

// 对话框状态
const showPatientDialog = ref(false);
const showPatientDetailDialog = ref(false);
const showEditPatientDialog = ref(false);

// 从父组件获取或从 store 获取
const showPatientManageDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const patients = computed(() => patientStore.patients);

// 表单数据
const patientForm = ref({
  patientName: "",
  birthDate: null,
  gender: "",
});

const editPatientForm = ref({
  patientId: "",
  patientName: "",
  birthDate: null,
  gender: "",
});

const currentPatientDetail = ref(null);

// 工具方法
const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
};

// 对话框控制方法
const openAddPatientForm = () => {
  patientForm.value = {
    patientName: "",
    birthDate: null,
    gender: "",
  };
  showPatientDialog.value = true;
};

const closeAddDialog = () => {
  showPatientDialog.value = false;
};

const viewPatient = (patient) => {
  currentPatientDetail.value = { ...patient };
  showPatientDetailDialog.value = true;
};

const editPatient = (patient) => {
  editPatientForm.value = {
    patientId: patient._id,
    patientName: patient.patientName,
    birthDate: new Date(patient.birthDate),
    gender: patient.gender,
  };
  showEditPatientDialog.value = true;
};

// 业务逻辑方法
const addPatient = async () => {
  if (!patientForm.value.patientName || !patientForm.value.birthDate || !patientForm.value.gender) {
    ElMessage.error("请填写所有必填项");
    return;
  }

  try {
    const response = await patientAPI.addPatient({
      userId: userStore.userId,
      ...patientForm.value,
    });

    patientStore.addPatient(response.data.data);
    ElMessage.success("就诊人添加成功");
    showPatientDialog.value = false;
    emit("patient-added", response.data.data);

    // 重置表单
    patientForm.value = {
      patientName: "",
      birthDate: null,
      gender: "",
    };
  } catch (error) {
    ElMessage.error("添加就诊人失败");
  }
};

const submitEditPatient = async () => {
  if (
    !editPatientForm.value.patientName ||
    !editPatientForm.value.birthDate ||
    !editPatientForm.value.gender
  ) {
    ElMessage.error("请填写所有必填项");
    return;
  }

  try {
    const updateData = {
      patientName: editPatientForm.value.patientName,
      birthDate: editPatientForm.value.birthDate,
      gender: editPatientForm.value.gender,
    };

    await patientAPI.updatePatient(editPatientForm.value.patientId, updateData);

    const index = patients.value.findIndex(
      (p) => p._id === editPatientForm.value.patientId
    );
    if (index !== -1) {
      patients.value[index] = {
        ...patients.value[index],
        ...updateData,
      };
    }

    ElMessage.success("就诊人信息更新成功");
    showEditPatientDialog.value = false;
    emit("patient-updated", updateData);
  } catch (error) {
    ElMessage.error("更新就诊人信息失败");
  }
};

const deletePatient = async (patientId) => {
  ElMessageBox.confirm(
    "确定删除该就诊人吗？此操作不可恢复。",
    "警告",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(async () => {
      try {
        await patientAPI.deletePatient(patientId);
        const index = patients.value.findIndex((p) => p._id === patientId);
        if (index !== -1) {
          patients.value.splice(index, 1);
        }
        ElMessage.success("就诊人删除成功");
        emit("patient-deleted", patientId);
      } catch (error) {
        ElMessage.error("删除就诊人失败");
      }
    })
    .catch(() => { });
};
</script>

<style scoped>
.patient-manage-container {
  padding: 20px;
}

.patient-manage-header {
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

.detail-label {
  font-weight: 600;
  color: #e5e7eb;
  min-width: 100px;
}

/* 移动端适配 */
@media (max-width: 768px) {

  .patient-manage-container {
    padding: 12px;
  }

  .patient-manage-header {
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
    padding: 4px 8px;
    font-size: 12px;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .detail-label {
    min-width: auto;
    font-size: 13px;
  }
}
</style>

<style>
/* 对话框表单 label 右侧对齐 */
.el-dialog :deep(.el-form-item__label) {
  text-align: right;
}

/* 对话框日期选择器全宽 */
.el-dialog :deep(.el-date-editor) {
  width: 100%;
}
</style>
