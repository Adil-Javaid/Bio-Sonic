// src/services/authService.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";

// Set up axios instance with base URL
const api = axios.create({
  baseURL: config.API_BASE_URL,
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh or 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token (if you implement refresh tokens)
        // const refreshToken = await AsyncStorage.getItem('refreshToken');
        // const response = await axios.post(`${config.API_BASE_URL}auth/refresh`, { refreshToken });

        // For now, just redirect to login
        await AsyncStorage.multiRemove(["authToken", "userData"]);
        // You might want to navigate to login screen here
        return Promise.reject(error);
      } catch (err) {
        // If refresh fails, clear storage and redirect to login
        await AsyncStorage.multiRemove(["authToken", "userData"]);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export const login = async (username, password) => {
  try {
    const response = await api.post("/login", { username, password });

    if (response.data?.success) {
      // Store token and user data
      await AsyncStorage.multiSet([
        ["authToken", response.data.token],
        ["userData", JSON.stringify(response.data.user)],
      ]);
      return response.data;
    }
    throw new Error(response.data?.message || "Login failed");
  } catch (error) {
    throw error;
  }
};

export const changePassword = async (
  username,
  currentPassword,
  newPassword
) => {
  try {
    const response = await api.post("/change-password", {
      username,
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = async () => {
  const userData = await AsyncStorage.getItem("userData");
  return userData ? JSON.parse(userData) : null;
};

export const getAuthToken = async () => {
  return await AsyncStorage.getItem("authToken");
};

export const logout = async () => {
  await AsyncStorage.multiRemove(["authToken", "userData"]);
};

export default api;
