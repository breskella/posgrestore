import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import StoresPage from "./pages/StoresPage";
import StorefrontPage from "./pages/StorefrontPage";
import StoreProductDetailsPage from "./pages/StoreProductDetailsPage";
import { useAuthStore } from "./store/useAuthStore";
import ProfilePage from "./pages/ProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ConfirmResetPage from "./pages/ConfirmResetPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CartPage from "./pages/CartPage";
import CartDrawer from "./components/CartDrawer";

const isAdminRole = (user) => user?.role === "store_admin" || user?.role === "super_admin";
const getAuthenticatedHome = (user) => (isAdminRole(user) ? "/dashboard" : "/stores");

function App() {
  const { user, checkAuth, isInitializing, sessionError } = useAuthStore();
  const location = useLocation();
  const hasLandingPageHeader = !user && location.pathname === "/";

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
          {!hasLandingPageHeader && <Navbar />}
          <Routes>
            <Route path="/" element={!user ? <LandingPage /> : <Navigate to={getAuthenticatedHome(user)} replace />} />
            <Route
              path="/dashboard"
              element={
                !user ? (
                  <Navigate to="/" replace />
                ) : isAdminRole(user) ? (
                  <HomePage />
                ) : (
                  <Navigate to="/stores" replace />
                )
              }
            />
            <Route
              path="/product/:id"
              element={
                !user ? (
                  <Navigate to="/" replace />
                ) : isAdminRole(user) ? (
                  <ProductPage />
                ) : (
                  <Navigate to="/stores" replace />
                )
              }
            />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/stores/:slug/products/:productId" element={<StoreProductDetailsPage />} />
            <Route path="/stores/:slug" element={<StorefrontPage />} />
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={getAuthenticatedHome(user)} replace />} />
            <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to={getAuthenticatedHome(user)} replace />} />
            <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" replace />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/confirm-password-reset/:token" element={<ConfirmResetPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          </Routes>
          <CartDrawer />
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
