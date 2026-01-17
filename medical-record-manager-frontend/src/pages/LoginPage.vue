<template>
  <div class="login-page">
    <div class="login-container">
      <h1>医疗病例管理系统</h1>
      <el-form @submit.prevent="isRegisterMode ? handleRegister() : handleLogin()"
        @keyup.enter="isRegisterMode ? handleRegister() : handleLogin()" label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" :maxlength="20" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item v-if="isRegisterMode" label="确认密码">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="isRegisterMode ? handleRegister() : handleLogin()" :loading="loading">
            {{ isRegisterMode ? "注 册" : "登 录" }}
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button @click="toggleMode" :disabled="loading">
            {{ isRegisterMode ? "已有账号？去登录" : "没有账号？去注册" }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/userStore";
import { authAPI } from "../services/api";
import { ElMessage } from "element-plus";

const router = useRouter();
const userStore = useUserStore();

const isRegisterMode = ref(false);
const loading = ref(false);

const form = reactive({
  username: "",
  password: "",
  confirmPassword: "",
});

// 仅在登录页时，将 html、body 的边距与内边距设为 0
onMounted(() => {
  document.documentElement.classList.add("login-page-reset");
  document.body.classList.add("login-page-reset");
});

onBeforeUnmount(() => {
  document.documentElement.classList.remove("login-page-reset");
  document.body.classList.remove("login-page-reset");
});

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value;
  form.username = "";
  form.password = "";
  form.confirmPassword = "";
};

const validateForm = () => {
  if (!form.username || !form.password) {
    ElMessage.error("请输入用户名和密码");
    return false;
  }

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
    ElMessage.error("用户名必须为3-20个字符，只能包含字母、数字和下划线");
    return false;
  }

  if (form.password.length < 6) {
    ElMessage.error("密码长度至少为6个字符");
    return false;
  }

  if (isRegisterMode.value && form.password !== form.confirmPassword) {
    ElMessage.error("两次输入的密码不一致");
    return false;
  }

  return true;
};

const handleLogin = async () => {
  if (!validateForm()) return;

  loading.value = true;
  try {
    const response = await authAPI.login(form.username, form.password);

    if (response.data.success) {
      userStore.setUser(
        response.data.userId,
        response.data.username,
        response.data.token,
        response.data.expiresIn
      );

      ElMessage.success("登录成功");
      router.push("/chat");
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "登录失败");
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  if (!validateForm()) return;

  loading.value = true;
  try {
    const response = await authAPI.register(form.username, form.password);

    if (response.data.success) {
      ElMessage.success("注册成功，请登录");
      isRegisterMode.value = false;
      form.password = "";
      form.confirmPassword = "";
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "注册失败");
  } finally {
    loading.value = false;
  }
};
</script>

<style>
/* 非 scoped：仅当登录页挂载时为 html、body 生效 */
html.login-page-reset,
body.login-page-reset {
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #0f1115;
  padding: 16px;
}

.login-container {
  background: #121417;
  padding: 32px;
  border-radius: 12px;
  border: 1px solid #1f2937;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
  width: 100%;
  max-width: 380px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue",
    Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  color: #e5e7eb;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .login-page {
    padding: 12px;
  }

  .login-container {
    padding: 24px 20px;
    border-radius: 8px;
    max-width: 100%;
  }

  .login-container h1 {
    font-size: 18px;
    margin-bottom: 20px;
  }

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  :deep(.el-form-item__label) {
    font-size: 14px;
  }

  :deep(.el-input__inner) {
    font-size: 16px;
    /* 防止iOS自动缩放 */
  }

  .login-container :deep(.el-button) {
    height: 44px;
    /* 移动端更易点击 */
    font-size: 15px;
  }
}

/* 小屏手机适配 */
@media (max-width: 375px) {
  .login-page {
    padding: 8px;
  }

  .login-container {
    padding: 20px 16px;
  }

  .login-container h1 {
    font-size: 16px;
    margin-bottom: 16px;
  }
}

.login-container h1 {
  text-align: center;
  margin-bottom: 24px;
  color: #f3f4f6;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

/* 顶部标签更简洁的配色 */
:deep(.el-form-item__label) {
  color: #9ca3af;
  font-weight: 500;
}

/* 输入框采用细边框、圆角，聚焦时高亮 */
:deep(.el-input__wrapper) {
  box-shadow: none;
  border: 1px solid #2a323c;
  border-radius: 8px;
  background: #0b0f14;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-input__wrapper:hover) {
  border-color: #3b82f6;
}

/* 输入内容与占位符颜色 */
:deep(.el-input__inner) {
  color: #e5e7eb;
}

:deep(.el-input__inner::placeholder) {
  color: #6b7280;
}

/* 按钮统一 100% 宽度，间距简洁 */
.login-container :deep(.el-button) {
  width: 100%;
  border-radius: 8px;
}

/* 主按钮为蓝色，适配深色背景 */
.login-container :deep(.el-button--primary) {
  background-color: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.login-container :deep(.el-button--primary:hover) {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
}

/* 次按钮为深灰色，悬停略亮 */
.login-container :deep(.el-button:is(:not(.el-button--primary))) {
  background-color: #1f2937;
  border-color: #374151;
  color: #e5e7eb;
}

.login-container :deep(.el-button:is(:not(.el-button--primary)):hover) {
  background-color: #374151;
  border-color: #4b5563;
}

/* 表单项间距适当收敛，更显简洁 */
:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
