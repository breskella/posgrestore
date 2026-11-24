import { create } from "zustand";
import API from "../axios";
import toast from "react-hot-toast";

try {
  localStorage.removeItem("token");
  localStorage.removeItem("userInfo");
} catch (error) {
  console.warn("Could not clear legacy authentication data:", error);
}

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: false,
  isInitializing: true,
  sessionError: null,
  error: null,

  setUser: (user) => set({ user }),

  checkAuth: async () => {
    try {
      const response = await API.get("/api/auth/check-auth");
      if (!response.data?.success || !response.data.data) {
        throw new Error("The session response did not include a user");
      }
      set({ user: response.data.data, sessionError: null });
    } catch (error) {
      if (error.response?.status === 401) {
        set({ user: null, sessionError: null });
      } else {
        console.error("Could not verify the current session:", error);
        set({
          user: null,
          sessionError: "Could not verify your session. Please try again.",
        });
      }
    } finally {
      set({ isInitializing: false });
    }
  },

  // Signup function
  signup: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await API.post("/api/auth/signup", userData);
      const data = res.data;

      set({ user: data.data, isLoading: false, sessionError: null });
      toast.success("Account created successfully");
      return { success: true, user: data.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to sign up";
      set({ error: message, isLoading: false });
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Login function
  login: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await API.post("/api/auth/login", userData);
      const data = res.data;

      set({ user: data.data, isLoading: false, sessionError: null });
      toast.success("Logged in successfully");
      return { success: true, user: data.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to log in";
      set({ error: message, isLoading: false });
      toast.error(message);
      return { success: false, error: message };
    }
  },

  logout: async () => {
    set({ user: null });
    try {
      await API.post("/api/auth/logout");
      return { success: true };
    } catch (error) {
      console.error("Could not complete logout:", error);
      return { success: false };
    }
  },
}));