import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/medical-record-manager/",
  plugins: [vue()],
  build: {
    assetsDir: "assets",
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      // "/medical-record-manager-server": {
      //   target: "http://192.168.1.3:7070",
      //   changeOrigin: true,
      // },
      "/medical-record-manager-server": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/medical-record-manager-server/, ""),
      },
    },
  },
});
