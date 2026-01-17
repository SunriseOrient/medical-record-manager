import { defineStore } from "pinia";
import { computed, ref } from "vue";

const STORAGE_KEY_USER_ID = "userId";
const STORAGE_KEY_USERNAME = "username";
const STORAGE_KEY_TOKEN = "token";
const STORAGE_KEY_TOKEN_EXPIRES = "tokenExpiresAt";
const storage = sessionStorage;

export const useUserStore = defineStore("user", () => {
  const userId = ref(null);
  const username = ref(null);
  const token = ref(null);
  const tokenExpiresAt = ref(null);

  const isLoggedIn = computed(() => {
    if (!token.value) return false;
    if (!tokenExpiresAt.value) return true;
    return tokenExpiresAt.value > Date.now();
  });

  const setUser = (id, name, authToken, expiresInSeconds) => {
    userId.value = id;
    username.value = name;
    token.value = authToken;
    const expiresAtMs = expiresInSeconds
      ? Date.now() + expiresInSeconds * 1000
      : null;
    tokenExpiresAt.value = expiresAtMs;

    storage.setItem(STORAGE_KEY_USER_ID, id);
    storage.setItem(STORAGE_KEY_USERNAME, name);
    storage.setItem(STORAGE_KEY_TOKEN, authToken);
    if (expiresAtMs) {
      storage.setItem(STORAGE_KEY_TOKEN_EXPIRES, String(expiresAtMs));
    } else {
      storage.removeItem(STORAGE_KEY_TOKEN_EXPIRES);
    }
  };

  const logout = () => {
    userId.value = null;
    username.value = null;
    token.value = null;
    tokenExpiresAt.value = null;
    storage.removeItem(STORAGE_KEY_USER_ID);
    storage.removeItem(STORAGE_KEY_USERNAME);
    storage.removeItem(STORAGE_KEY_TOKEN);
    storage.removeItem(STORAGE_KEY_TOKEN_EXPIRES);
  };

  const restoreFromCache = () => {
    const cachedUserId = storage.getItem(STORAGE_KEY_USER_ID);
    const cachedUsername = storage.getItem(STORAGE_KEY_USERNAME);
    const cachedToken = storage.getItem(STORAGE_KEY_TOKEN);
    const cachedExpires = Number(storage.getItem(STORAGE_KEY_TOKEN_EXPIRES));

    if (cachedExpires && cachedExpires < Date.now()) {
      logout();
      return;
    }

    if (cachedUserId && cachedUsername && cachedToken) {
      userId.value = cachedUserId;
      username.value = cachedUsername;
      token.value = cachedToken;
      tokenExpiresAt.value = cachedExpires || null;
    }
  };

  return {
    userId,
    username,
    token,
    tokenExpiresAt,
    isLoggedIn,
    setUser,
    logout,
    restoreFromCache,
  };
});
