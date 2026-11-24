function ProductCardSkeleton() {
  return (
    <div className="card w-full animate-pulse overflow-hidden bg-base-100 shadow-lg" aria-hidden="true">
      <div className="skeleton h-48 w-full rounded-none sm:h-52" />
      <div className="card-body gap-4 p-4 sm:p-5">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-6 w-3/4" />
        <div className="flex items-center justify-between">
          <div className="skeleton h-8 w-1/3" />
          <div className="skeleton h-4 w-16" />
        </div>
        <div className="flex justify-end gap-2">
          <div className="skeleton size-8" />
          <div className="skeleton size-8" />
          <div className="skeleton size-8" />
        </div>
      </div>
    </div>
  );
}

export default ProductCardSkeleton;
