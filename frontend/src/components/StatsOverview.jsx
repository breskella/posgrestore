import { PackageIcon, DollarSignIcon } from "lucide-react";

function StatsOverview({ totalProducts = 0, inventoryValue = 0 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 mb-6 sm:mb-8">
      <div className="stats shadow bg-base-100 border border-base-300 w-full overflow-hidden">
        <div className="stat p-4 sm:p-6">
          <div className="stat-figure text-primary">
            <PackageIcon className="size-6 sm:size-8" />
          </div>
          <div className="stat-title text-xs sm:text-sm text-base-content/70">Total Products</div>
          <div className="stat-value text-2xl sm:text-3xl lg:text-4xl text-primary truncate">{totalProducts}</div>
          <div className="stat-desc text-xs text-base-content/50">Unique inventory types</div>
        </div>
      </div>

      <div className="stats shadow bg-base-100 border border-base-300 w-full overflow-hidden">
        <div className="stat p-4 sm:p-6">
          <div className="stat-figure text-secondary">
            <DollarSignIcon className="size-6 sm:size-8" />
          </div>
          <div className="stat-title text-xs sm:text-sm text-base-content/70">Inventory Value</div>
          <div className="stat-value text-2xl sm:text-3xl lg:text-4xl text-secondary truncate">${Number(inventoryValue || 0).toFixed(2)}</div>
          <div className="stat-desc text-xs text-base-content/50">Total worth of products</div>
        </div>
      </div>
    </div>
  );
}

export default StatsOverview;