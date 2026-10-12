import { useState } from "react";
import { Link } from "react-router-dom";
import { MailIcon, ArrowLeftIcon, SendIcon } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:3000/api/auth/forgot-password", {
        email,
      });

      if (response.status >= 200 && response.status < 300 && response.data.success) {
        setSubmitted(true);
        toast.success(response.data.message || "Confirmation email sent.");
      } else {
        throw new Error(response.data.message || "Could not request password reset");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to request password reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-base-100 rounded-2xl shadow-xl p-8 border border-base-content/10">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-primary/10 rounded-full text-primary mb-4">
            <MailIcon className="size-8" />
          </div>
          <h1 className="text-2xl font-bold">Forgot Password?</h1>
          <p className="text-sm text-base-content/60 mt-1">
            We’ll send a confirmation email before any reset is activated.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email Address</span>
              </label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-3.5 size-5 text-base-content/40" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="input input-bordered w-full pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full gap-2" disabled={loading}>
              <SendIcon className="size-5" />
              {loading ? "Sending..." : "Send Confirmation Email"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-sm text-base-content/70">
              If an account exists for <span className="font-semibold">{email}</span>, a confirmation email has been sent.
            </p>
            <p className="text-sm text-base-content/70">
              Click “Approve Password Reset” in the email before the reset form becomes valid.
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

export default ForgotPasswordPage;