import { createRouter, createWebHashHistory } from "vue-router";

const TOKEN_KEY = "token";
const TOKEN_EXPIRES_KEY = "tokenExpiresAt";
const USER_ID_KEY = "userId";
const USERNAME_KEY = "username";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("../pages/LoginPage.vue"),
  },
  {
    path: "/",
    redirect: "/chat",
  },
  {
    path: "/chat",
    name: "Chat",
    component: () => import("../pages/ChatPage.vue"),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const expiresAt = Number(sessionStorage.getItem(TOKEN_EXPIRES_KEY));
  const token = sessionStorage.getItem(TOKEN_KEY);

  if (expiresAt && expiresAt < Date.now()) {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRES_KEY);
    sessionStorage.removeItem(USER_ID_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
  }

  const isLoggedIn = !!token;

  if (to.meta.requiresAuth && !isLoggedIn) {
    next("/login");
  } else if (to.path === "/login" && isLoggedIn) {
    next("/chat");
  } else {
    next();
  }
});

export default router;
