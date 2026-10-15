import { useState, useEffect } from "react";
import { UserIcon, MailIcon, LockIcon, SaveIcon, ShieldCheckIcon } from "lucide-react";
import toast from "react-hot-toast";
import API from "../axios";
import { useAuthStore } from "../store/useAuthStore";

const ProfilePage = () => {
  const { user, token, setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    currentPassword: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        password: "",
        currentPassword: "",
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const currentToken = token || localStorage.getItem("token");
    if (!currentToken) {
      toast.error("Your session has expired. Please log in again.");
      setLoading(false);
      return;
    }

    if (!formData.currentPassword) {
      toast.error("Your current password is required before saving profile changes.");
      setLoading(false);
      return;
    }

    try {
      const profileData = {
        userId: user?.id,
        username: formData.username.trim(),
        email: formData.email.trim(),
        currentPassword: formData.currentPassword,
        ...(formData.password ? { password: formData.password } : {}),
      };

      const response = await API.put("/api/users/profile", profileData, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      if (response.data.success) {
        setUser(response.data.data);
        setFormData((current) => ({ ...current, ...response.data.data, password: "", currentPassword: "" }));
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Profile update error:", error.response || error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-base-100 rounded-2xl shadow-xl p-8 border border-base-content/10">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-primary/10 rounded-full text-primary">
            <UserIcon className="size-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Account Profile</h1>
            <p className="text-sm text-base-content/60">Manage your account information and security</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Username</span>
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3.5 size-5 text-base-content/40" />
              <input
                type="text"
                className="input input-bordered w-full pl-10"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Email Address</span>
            </label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-3.5 size-5 text-base-content/40" />
              <input
                type="email"
                className="input input-bordered w-full pl-10"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Current Password</span>
            </label>
            <div className="relative">
              <ShieldCheckIcon className="absolute left-3 top-3.5 size-5 text-base-content/40" />
              <input
                type="password"
                placeholder="Enter your current password"
                className="input input-bordered w-full pl-10"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">New Password (optional)</span>
            </label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-3.5 size-5 text-base-content/40" />
              <input
                type="password"
                placeholder="Leave blank to keep current password"
                className="input input-bordered w-full pl-10"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full gap-2" disabled={loading}>
            <SaveIcon className="size-5" />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;