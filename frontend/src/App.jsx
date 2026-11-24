import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { useAuthStore } from "./store/useAuthStore";
import ProfilePage from "./pages/ProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ConfirmResetPage from "./pages/ConfirmResetPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  const { user, checkAuth, isInitializing, sessionError } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (sessionError) toast.error(sessionError);
  }, [sessionError]);

  return (
    <div className="min-h-screen bg-base-200 transition-colors duration-300">
      {isInitializing ? (
        <div className="flex min-h-screen items-center justify-center" role="status">
          Checking session...
        </div>
      ) : (
        <>
          {user && <Navbar />}
          <Routes>
            <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={user ? <HomePage /> : <Navigate to="/" replace />} />
            <Route path="/product/:id" element={user ? <ProductPage /> : <Navigate to="/" replace />} />
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
            <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/dashboard" />} />
            <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/confirm-password-reset/:token" element={<ConfirmResetPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          </Routes>
        </>
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: "rounded-xl shadow-lg",
        }}
      />
    </div>
  );
}

export default App;