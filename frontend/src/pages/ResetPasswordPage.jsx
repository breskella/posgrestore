import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { LockIcon, CheckCircleIcon, ArrowLeftIcon } from "lucide-react";
import toast from "react-hot-toast";
import API from "../axios";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await API.post(`/api/auth/reset-password/${token}`, {
        password,
      });

      if (response.status >= 200 && response.status < 300 && response.data.success) {
        setSuccess(true);
        toast.success(response.data.message || "Password reset successfully");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        throw new Error(response.data.message || "Could not reset password");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-base-100 rounded-2xl shadow-xl p-8 border border-base-content/10">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-primary/10 rounded-full text-primary mb-4">
            <LockIcon className="size-8" />
          </div>
          <h1 className="text-2xl font-bold">Set New Password</h1>
          <p className="text-sm text-base-content/60 mt-1">
            Please enter your new password below.
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">New Password</span>
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-3.5 size-5 text-base-content/40" />
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="input input-bordered w-full pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Confirm Password</span>
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-3.5 size-5 text-base-content/40" />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="input input-bordered w-full pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full gap-2" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex justify-center text-success">
              <CheckCircleIcon className="size-12" />
            </div>
            <p className="text-sm font-medium text-base-content">
              Password has been reset successfully! Redirecting to login...
            </p>
          </div>
        )}

        <div className="text-center mt-6">
          <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeftIcon className="size-4" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;