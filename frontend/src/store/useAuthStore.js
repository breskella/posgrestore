import { create } from "zustand";

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
      const res = await fetch("http://localhost:3000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to sign up");

      localStorage.setItem("token", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data.data));

      set({ user: data.data, token: data.token, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Login function
  login: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to log in");

      localStorage.setItem("token", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data.data));

      set({ user: data.data, token: data.token, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Logout function
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    set({ user: null, token: null });
  },
}));