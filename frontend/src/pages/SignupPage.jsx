import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, User, Loader2, Store, ShoppingBag } from "lucide-react";

const SignupPage = () => {
  const [role, setRole] = useState("customer");
  const [username, setUsername] = useState("");
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signup, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const slugPreview = storeName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      username,
      email,
      password,
      role,
      ...(role === "store_admin" ? { storeName } : {}),
    };

    const result = await signup(payload);
    if (result.success) {
      const destination = result.user?.role === "customer" ? "/stores" : "/dashboard";
      navigate(destination, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 py-8">
      <div className="card w-full max-w-md bg-base-100 shadow-xl p-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-primary">Create Account</h2>
          <p className="text-sm text-base-content/60 mt-1">
            {role === "store_admin"
              ? "Launch your electronics store with a 14-day free trial"
              : "Sign up to browse and shop electronics stores"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Type Selection */}
          <div className="form-control">
            <label className="label pb-1.5">
              <span className="label-text font-medium">Account Type</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRole("customer")}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all duration-150 cursor-pointer ${
                  role === "customer"
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-base-300 bg-base-200/40 text-base-content/70 hover:border-base-content/30"
                }`}
              >
                <ShoppingBag size={20} />
                <span className="text-xs sm:text-sm font-semibold">Customer (Shopper)</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("store_admin")}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all duration-150 cursor-pointer ${
                  role === "store_admin"
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-base-300 bg-base-200/40 text-base-content/70 hover:border-base-content/30"
                }`}
              >
                <Store size={20} />
                <span className="text-xs sm:text-sm font-semibold">Store Owner (Admin)</span>
              </button>
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Username</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-base-content/40">
                <User size={18} />
              </span>
              <input
                type="text"
                placeholder="Your Name"
                className="input input-bordered w-full pl-10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {role === "store_admin" && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Store Name</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-base-content/40">
                  <Store size={18} />
                </span>
                <input
                  type="text"
                  placeholder="e.g. VoltTech Electronics"
                  className="input input-bordered w-full pl-10"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  minLength={2}
                  maxLength={150}
                  required
                />
              </div>
              {slugPreview && (
                <label className="label pb-0 pt-1">
                  <span className="label-text-alt text-base-content/60">
                    Store URL slug: <span className="font-mono text-primary">/stores/{slugPreview}</span>
                  </span>
                </label>
              )}
            </div>
          )}

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
                minLength={8}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full mt-2" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
            {role === "store_admin" ? "Create Store & Sign Up" : "Sign Up as Customer"}
          </button>
        </form>

        <div className="text-center mt-4 text-sm">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
