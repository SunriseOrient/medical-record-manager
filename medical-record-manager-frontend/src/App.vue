<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onBeforeMount } from "vue";
import { useUserStore } from "./stores/userStore";

const userStore = useUserStore();

// 应用启动时从缓存恢复用户状态
onBeforeMount(() => {
  userStore.restoreFromCache();
});
</script>

<style scoped>
#app {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  width:100%;
  height:100%;
}
</style>
