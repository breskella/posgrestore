import { create } from "zustand";
import API from "../axios";
import toast from "react-hot-toast";
import { useCartStore } from "./useCartStore";

const synchronizeCart = async (user) => {
  try {
    await useCartStore.getState().onAuthenticated(user);
  } catch (error) {
    console.error("Could not synchronize cart after authentication:", error);
    toast.error("You are signed in, but your cart could not be synchronized.");
  }
};

const resetCartForGuest = async () => {
  try {
    useCartStore.getState().onLoggedOut();
  } catch (error) {
    console.error("Could not reset cart after logout:", error);
  }
};

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
      await synchronizeCart(response.data.data);
    } catch (error) {
      if (error.response?.status === 401) {
        set({ user: null, sessionError: null });
        await resetCartForGuest();
      } else {
        console.error("Could not verify the current session:", error);
        set({
          user: null,
          sessionError: "Could not verify your session. Please try again.",
        });
        await resetCartForGuest();
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
      await synchronizeCart(data.data);
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
      await synchronizeCart(data.data);
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
    await resetCartForGuest();
    try {
      await API.post("/api/auth/logout");
      return { success: true };
    } catch (error) {
      console.error("Could not complete logout:", error);
      return { success: false };
    }
  },
}));