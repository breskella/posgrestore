import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircleIcon, LockIcon, AlertTriangleIcon, ShieldCheckIcon } from "lucide-react";
import axios from "axios";

const ConfirmResetPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("Please confirm that you want to approve this password reset request.");
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!token) {
      setStatus("error");
      setMessage("This confirmation link is invalid or missing.");
      return;
    }

    setLoading(true);
    setStatus("processing");
    setMessage("Verifying your approval request...");

    try {
      const response = await axios.post(`http://localhost:3000/api/auth/confirm-password-reset/${token}`);

      if (response.data.success && response.data.data?.resetToken) {
        setStatus("success");
        setMessage("Password reset approved. Redirecting to the secure reset form...");
        setTimeout(() => {
          navigate(`/reset-password/${response.data.data.resetToken}`, { replace: true });
        }, 1200);
        return;
      }

      setStatus("error");
      setMessage(response.data.message || "This confirmation link is invalid or has expired.");
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || "This confirmation link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-base-100 rounded-2xl shadow-xl p-8 border border-base-content/10 text-center">
        <div className="mb-6 flex justify-center">
          {status === "success" ? (
            <CheckCircleIcon className="size-14 text-success" />
          ) : status === "error" ? (
            <AlertTriangleIcon className="size-14 text-error" />
          ) : status === "processing" ? (
            <LockIcon className="size-14 text-primary animate-pulse" />
          ) : (
            <ShieldCheckIcon className="size-14 text-primary" />
          )}
        </div>

        <h1 className="text-2xl font-bold mb-2">
          {status === "success" ? "Approved" : status === "error" ? "Link Expired" : "Approve Password Reset"}
        </h1>

        <p className="text-sm text-base-content/70 mb-6">{message}</p>

        {status !== "success" && status !== "error" && (
          <button
            type="button"
            onClick={handleApprove}
            disabled={loading}
            className="btn btn-primary w-full gap-2"
          >
            {loading ? "Approving..." : "Approve Password Reset"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ConfirmResetPage;
