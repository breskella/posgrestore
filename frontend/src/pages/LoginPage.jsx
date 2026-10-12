import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login({ email, password });
    if (result.success) {
      navigate("/"); // Redirect to home page after successful login
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl p-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-primary">Welcome Back</h2>
          <p className="text-sm text-base-content/60 mt-1">Sign in to access your inventory</p>
        </div>

        {error && (
          <div className="alert alert-error mb-4 text-sm py-2">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-base-content/40">
                <Mail size={18} />
              </span>
              <input
                type="email"
                placeholder="name@example.com"
                className="input input-bordered w-full pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-base-content/40">
                <Lock size={18} />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered w-full pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {/* Forgot password link */}
            <label className="label justify-end pb-0 pt-1">
              <Link to="/forgot-password" className="label-text-alt text-primary hover:underline">
                Forgot password?
              </Link>
            </label>
          </div>

          <button type="submit" className="btn btn-primary w-full mt-2" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            Login
          </button>
        </form>

        <div className="text-center mt-4 text-sm">
          <p>
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
        
      </div>
    </div>
  );
};

export default LoginPage;