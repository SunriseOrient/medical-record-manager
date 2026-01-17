import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import "./style.css";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { useUserStore } from "./stores/userStore";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(ElementPlus, { locale: zhCn });

// 恢复会话内的登录状态
const userStore = useUserStore();
userStore.restoreFromCache();

// 全站启用深色主题
document.documentElement.classList.add("dark");

app.mount("#app");
