<template>
  <div class="login-bg">
    <div class="login-card">
      <div class="login-header">
        <div class="login-title"><img src="/favicon.svg" class="login-logo" alt="logo" />
          <h1>医疗病例管理系统</h1>
        </div>
        <div class="login-subtitle">Medical Record Manager</div>
      </div>
      <el-form class="login-form" @submit.prevent="isRegisterMode ? handleRegister() : handleLogin()">
        <el-form-item>
          <el-input v-model="form.username" placeholder="请输入用户名" :maxlength="20" size="large">
            <template #prefix>
              <el-icon>
                <User />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password size="large">
            <template #prefix>
              <el-icon>
                <Lock />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="isRegisterMode">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password size="large">
            <template #prefix>
              <el-icon>
                <Lock />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="isRegisterMode ? handleRegister() : handleLogin()"
            :loading="loading">
            {{ isRegisterMode ? "注 册" : "登 录" }}
          </el-button>
        </el-form-item>
        <div class="login-divider"></div>
        <div class="login-helper">
          还没有账号？<el-button class="login-switch-btn" @click="toggleMode" :disabled="loading" link>
            {{ isRegisterMode ? "已有账号？去登录" : "立即注册" }}
          </el-button>
        </div>
      </el-form>
    </div>
    <div class="login-footer">© 2026 医疗病例管理系统. All rights reserved.</div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/userStore";
import { authAPI } from "../services/api";
import { ElMessage } from "element-plus";
import { User, Lock } from '@element-plus/icons-vue';

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
html.login-page-reset,
body.login-page-reset {
  margin: 0;
  padding: 0;
}

:root {
  --app-bg-color-secondary: #252525;
  --app-bg-color: #1a1a1a;
  --app-card-bg-color: #252525;
}

.login-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--app-bg-color-secondary) 0%, var(--app-bg-color) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0;
}

.login-card {
  background: var(--app-card-bg-color);
  border-radius: 16px;
  box-shadow: 0 6px 32px 0 rgba(0, 0, 0, 0.18);
  padding: 48px 40px 32px 40px;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1.5px solid #313235;
  box-sizing: border-box;
}

@media (max-width: 600px) {
  .login-bg {
    padding: 0 4vw;
  }

  .login-card {
    padding: 24px 8px 20px 8px;
    border-radius: 10px;
    max-width: 100vw;
    min-width: 0;
    box-sizing: border-box;
  }

  .login-header {
    margin-bottom: 18px;
  }

  .login-title {
    font-size: 1.1rem;
  }

  .login-logo {
    width: 32px;
    height: 32px;
  }

  .login-btn {
    height: 42px;
    font-size: 1rem;
  }

  :deep(.el-input__wrapper) {
    min-height: 40px;
    font-size: 1rem;
  }

  .login-footer {
    font-size: 12px;
    bottom: 10px;
  }
}

@media (max-width: 375px) {
  .login-bg {
    padding: 0 2vw;
  }

  .login-card {
    padding: 14px 2px 12px 2px;
    border-radius: 8px;
  }

  .login-title {
    font-size: 1rem;
  }
}
</style>

<style scoped>
.login-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--app-bg-color-secondary) 0%, var(--app-bg-color) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.login-card {
  background: var(--app-card-bg-color);
  border-radius: 16px;
  box-shadow: 0 6px 32px 0 rgba(0, 0, 0, 0.18);
  padding: 48px 40px 32px 40px;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1.5px solid #313235;
  box-sizing: border-box;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
  width: 100%;
}

.login-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.10);
  margin-right: 10px;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: #f3f4f6;
  margin-bottom: 6px;
  letter-spacing: 2px;
  font-family: 'Segoe UI', 'Arial', 'Helvetica Neue', Arial, sans-serif;
  display: flex;
  align-items: center;

  h1 {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
    font-family: Arial, Helvetica, sans-serif;
    margin: 0;
  }
}

.login-subtitle {
  font-size: 13px;
  color: #bfc3c9;
  text-align: center;
  margin-bottom: 0;
  font-family: 'Segoe UI', 'Arial', 'Helvetica Neue', Arial, sans-serif;
  margin-top: 10px;
}

.login-form {
  width: 100%;
}

:deep(.el-input__wrapper) {
  background: #232426;
  border: 1.5px solid #393a3d;
  box-shadow: none;
  transition: border-color 0.2s;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-input__wrapper:hover) {
  border-color: #4e8cff;
}

:deep(.el-input__inner) {
  color: #f3f4f6;
  font-size: 1.08rem;
}

:deep(.el-input__inner::placeholder) {
  color: #7c7f85;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 1.12rem;
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 1px;
  background: #4e8cff;
  border: none;
  color: #fff;
  box-shadow: 0 2px 8px 0 rgba(78, 140, 255, 0.08);
  transition: background 0.2s;
}

.login-btn:hover {
  background: #357ae8;
}

.login-divider {
  width: 100%;
  height: 1px;
  background: #313235;
  margin: 18px 0 10px 0;
  opacity: 0.7;
}

.login-helper {
  width: 100%;
  text-align: center;
  color: #bfc3c9;
  font-size: 15px;
  margin-bottom: 2px;
}

.login-switch-btn {
  color: #4e8cff;
  font-weight: 500;
  font-size: 15px;
  margin-left: 4px;
  padding: 0;
}

.login-footer {
  width: 100vw;
  text-align: center;
  color: #7c7f85;
  font-size: 13px;
  position: absolute;
  left: 0;
  bottom: 24px;
  letter-spacing: 0.2px;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

@media (max-width: 600px) {
  .login-bg {
    padding: 0 4vw;
  }

  .login-card {
    padding: 24px 8px 20px 8px;
    border-radius: 10px;
    max-width: 100vw;
    min-width: 0;
    box-sizing: border-box;
  }

  .login-header {
    margin-bottom: 18px;
  }

  .login-title {
    font-size: 1.1rem;
  }

  .login-logo {
    width: 32px;
    height: 32px;
  }

  .login-btn {
    height: 42px;
    font-size: 1rem;
  }

  :deep(.el-input__wrapper) {
    min-height: 40px;
    font-size: 1rem;
  }

  .login-footer {
    font-size: 12px;
    bottom: 10px;
  }
}

@media (max-width: 375px) {
  .login-bg {
    padding: 0 2vw;
  }

  .login-card {
    padding: 14px 2px 12px 2px;
    border-radius: 8px;
  }

  .login-title {
    font-size: 1rem;
  }
}
</style>
