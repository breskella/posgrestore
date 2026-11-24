import { Link } from "react-router-dom";
import { StoreIcon, ShoppingBagIcon, SparklesIcon, ArrowRightIcon, UserIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

function StoresPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "store_admin" || user?.role === "super_admin";

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="card bg-base-100 shadow-xl border border-base-content/10 p-6 sm:p-10 text-center space-y-6">
        <div className="mx-auto size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <ShoppingBagIcon className="size-8" />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 badge badge-primary badge-outline px-3 py-3 text-xs font-semibold">
            <SparklesIcon className="size-3.5" />
            Multi-Tenant Storefront Coming Soon
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold">
            Welcome, {user?.username || "Shopper"}!
          </h1>
          <p className="text-sm sm:text-base text-base-content/65">
            You are signed in as a <span className="font-semibold text-base-content">{user?.role}</span>.
            The public electronics stores directory and customer shopping storefront will be built here in the next task.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {isAdmin && (
            <Link to="/dashboard" className="btn btn-primary gap-2">
              <StoreIcon className="size-4" />
              Go to Store Dashboard
              <ArrowRightIcon className="size-4" />
            </Link>
          )}
          <Link to="/profile" className="btn btn-outline gap-2">
            <UserIcon className="size-4" />
            Account Profile
          </Link>
        </div>
      </div>
    </main>
  );
}

export default StoresPage;
