import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { useAuthStore } from "./store/useAuthStore";
import { Toaster } from "react-hot-toast";
import ProfilePage from "./pages/ProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ConfirmResetPage from "./pages/ConfirmResetPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-base-200 transition-colors duration-300">
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

      <Toaster />
    </div>
  );
}

export default App;