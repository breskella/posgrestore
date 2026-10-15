import { create } from "zustand";
import API from "../axios"; 

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("userInfo")) || null,
  token: localStorage.getItem("token") || null,
  isLoading: false,
  error: null,

  setUser: (user) => {
    localStorage.setItem("userInfo", JSON.stringify(user));
    set({ user });
  },

  // Signup function
  signup: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await API.post("/api/auth/signup", userData);
      const data = res.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data.data));

      set({ user: data.data, token: data.token, isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to sign up";
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Login function
  login: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await API.post("/api/auth/login", userData);
      const data = res.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data.data));

      set({ user: data.data, token: data.token, isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to log in";
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Logout function
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    set({ user: null, token: null });
  },
}));