import { create } from "zustand";

const getInitialTheme = () => {
  if (typeof window === "undefined") return "forest";
  try {
    return localStorage.getItem("preferred-theme") || "forest";
  } catch {
    return "forest";
  }
};

export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("preferred-theme", theme);
      } catch {
        // The theme still applies for this session when storage is unavailable.
      }
      document.documentElement.dataset.theme = theme;
    }
    set({ theme });
  },
}));