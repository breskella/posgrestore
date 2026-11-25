import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserIcon, MailIcon, LockIcon, SaveIcon, ShieldCheckIcon, ArrowLeftIcon } from "lucide-react";
import toast from "react-hot-toast";
import API from "../axios";
import { useAuthStore } from "../store/useAuthStore";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [formData, setFormData] = useState(() => ({
    username: user?.username || "",
    email: user?.email || "",
    password: "",
    currentPassword: "",
    storeDescription: user?.store?.description || "",
    storeLogoUrl: user?.store?.logo_url || "",
  }));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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
        ...(user?.role === "store_admin"
          ? {
              storeDescription: formData.storeDescription,
              storeLogoUrl: formData.storeLogoUrl,
            }
          : {}),
      };

      const response = await API.put("/api/users/profile", profileData);

      if (response.data.success) {
        setUser(response.data.data);
        setFormData((current) => ({
          ...current,
          username: response.data.data.username,
          email: response.data.data.email,
          storeDescription: response.data.data.store?.description || "",
          storeLogoUrl: response.data.data.store?.logo_url || "",
          password: "",
          currentPassword: "",
        }));
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
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3.5 sm:p-4 bg-primary/10 rounded-2xl text-primary shrink-0">
              <UserIcon className="size-7 sm:size-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Account Profile</h1>
              <p className="text-xs sm:text-sm text-base-content/60">Manage your account information and security</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(user?.role === "customer" ? "/stores" : "/dashboard")}
            className="btn btn-ghost btn-sm gap-2 rounded-xl border border-base-content/10 hover:border-primary/40 hover:bg-base-200 text-base-content/80 hover:text-base-content transition-all duration-200 cursor-pointer shrink-0"
            title="Back"
          >
            <ArrowLeftIcon className="size-4" />
            <span className="font-medium text-sm">Back</span>
          </button>
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

          {user?.role === "store_admin" && (
            <div className="border-t border-base-200 pt-5 space-y-5">
              <div>
                <h2 className="font-semibold">Storefront details</h2>
                <p className="text-sm text-base-content/60">These details appear on your public store page.</p>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Store Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered min-h-24 w-full"
                  maxLength={2000}
                  value={formData.storeDescription}
                  onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
                  placeholder="Tell shoppers what makes your store special"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Store Logo URL</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered w-full"
                  maxLength={2048}
                  value={formData.storeLogoUrl}
                  onChange={(e) => setFormData({ ...formData, storeLogoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
                <label className="label">
                  <span className="label-text-alt">Leave blank to use your store initials.</span>
                </label>
              </div>
            </div>
          )}

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