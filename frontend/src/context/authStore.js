import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../utils/api";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post("/auth/login", { email, password });
          set({ user: res.data.user, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: error.response?.data?.message || "Login failed" };
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const res = await api.post("/auth/register", userData);
          set({ user: res.data.user, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: error.response?.data?.message || "Registration failed" };
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch (error) {
          console.error(error);
        }
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },

      getMe: async () => {
        try {
          const res = await api.get("/auth/me");
          set({ user: res.data.user, isAuthenticated: true });
        } catch (error) {
          set({ user: null, isAuthenticated: false });
        }
      },

      // ─── Password Reset ───────────────────────────────────────────────

      forgotPassword: async (email) => {
        set({ isLoading: true });
        try {
          const res = await api.post("/auth/forgot-password", { email });
          set({ isLoading: false });
          return { success: true, message: res.data.message };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: error.response?.data?.message || "Something went wrong" };
        }
      },

      resetPassword: async (token, newPassword) => {
        set({ isLoading: true });
        try {
          const res = await api.post(`/auth/reset-password/${token}`, { newPassword });
          set({ isLoading: false });
          return { success: true, message: res.data.message };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, message: error.response?.data?.message || "Reset failed" };
        }
      },
    }),
    {
      name: "snapgram-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
