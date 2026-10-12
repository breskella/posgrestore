import { PackageIcon, DollarSignIcon } from "lucide-react";

function StatsOverview({ totalProducts = 0, inventoryValue = 0 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <div className="stats shadow bg-base-100 border border-base-300">
        <div className="stat">
          <div className="stat-figure text-primary">
            <PackageIcon className="size-8" />
          </div>
          <div className="stat-title text-base-content/70">Total Products</div>
          <div className="stat-value text-primary">{totalProducts}</div>
          <div className="stat-desc text-base-content/50">Unique inventory types</div>
        </div>
      </div>

      <div className="stats shadow bg-base-100 border border-base-300">
        <div className="stat">
          <div className="stat-figure text-secondary">
            <DollarSignIcon className="size-8" />
          </div>
          <div className="stat-title text-base-content/70">Inventory Value</div>
          <div className="stat-value text-secondary">${Number(inventoryValue || 0).toFixed(2)}</div>
          <div className="stat-desc text-base-content/50">Total worth of products</div>
        </div>
      </div>
    </div>
  );
}

export default StatsOverview;