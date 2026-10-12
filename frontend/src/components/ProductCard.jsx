import { EditIcon, Trash2Icon, AlertTriangleIcon, PackageCheckIcon, AlertCircleIcon, HashIcon, CalendarIcon, CopyIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useProductStore } from "../store/useProductStore";
function ProductCard({ product }) {
  const { deleteProduct, cloneProduct, pagination } = useProductStore();

  // Determine stock status and low stock condition based on product count
  const parsedCount = Number(product.count);
  const count = Number.isSafeInteger(parsedCount) && parsedCount >= 0 ? parsedCount : 0;
  const isInStock = count > 0;
  const isLowStock = count > 0 && count < 5; // Low stock threshold (between 1 and 4)

  // Function to open the delete confirmation modal for this product
  const openDeleteModal = () => {
    document.getElementById(`delete_modal_${product.id}`).showModal();
  };

  // Function to close the modal and execute product deletion
  const confirmDelete = async () => {
    await deleteProduct(product.id, pagination.currentPage);
    document.getElementById(`delete_modal_${product.id}`).close();
  };

  return (
    <>
      {/* Product card with hover and entrance animation class */}
      <div className="card bg-base-100 shadow-xl product-card">
        {/* PRODUCT IMAGE */}
        <figure className="relative pt-[56.25%] overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="product-card-image absolute top-0 left-0 w-full h-full object-cover"
          />
          {/* STOCK BADGE OVERLAY WITH LOW STOCK SUPPORT */}
          <div className="absolute top-3 right-3">
            {count === 0 ? (
              <span className="badge badge-error gap-1 text-white font-medium shadow-md">
                <AlertCircleIcon className="size-3.5" />
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="badge badge-warning gap-1 text-white font-medium shadow-md">
                <AlertTriangleIcon className="size-3.5" />
                Low Stock ({count})
              </span>
            ) : (
              <span className="badge badge-success gap-1 text-white font-medium shadow-md">
                <PackageCheckIcon className="size-3.5" />
                In Stock ({count})
              </span>
            )}
          </div>
        </figure>

        <div className="card-body">
          {/* CATEGORY TAG */}
          {product.category && (
            <span className="badge badge-ghost badge-sm w-fit mb-1">
              {product.category}
            </span>
          )}

          {/* PRODUCT INFO */}
          <h2 className="card-title text-lg font-semibold">{product.name}</h2>

          <div className="flex justify-between items-center mt-2">
            <p className="text-2xl font-bold text-primary">${Number(product.price).toFixed(2)}</p>
            <div className="flex items-center text-base-content/70 text-sm gap-1">
              <HashIcon className="size-4" />
              <span>Qty: {count}</span>
            </div>
          </div>

          {/* CREATED AT DATE DISPLAY */}
          {product.created_at && (
            <div className="flex items-center gap-1.5 text-xs text-base-content/60 mt-2 border-t border-base-200 pt-2">
              <CalendarIcon className="size-3.5" />
              <span>Added: {new Date(product.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}

          {/* CARD ACTIONS */}
          <div className="card-actions justify-end mt-4">
            <button
              className="btn btn-sm btn-success btn-outline"
              onClick={() => cloneProduct(product.id)}
              title="Duplicate Product"
            >
              <CopyIcon className="size-4" />
            </button>

            <Link to={`/product/${product.id}`} className="btn btn-sm btn-info btn-outline">
              <EditIcon className="size-4" />
            </Link>

            <button
              className="btn btn-sm btn-error btn-outline"
              onClick={openDeleteModal}
            >
              <Trash2Icon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <dialog id={`delete_modal_${product.id}`} className="modal">
        <div className="modal-box">
          <div className="flex items-center gap-3 text-error mb-4">
            <AlertTriangleIcon className="size-8" />
            <h3 className="font-bold text-lg">Are you sure?</h3>
          </div>
          <p className="py-2 text-base-content/70">
            You are about to delete <span className="font-semibold text-base-content">"{product.name}"</span>. This action cannot be undone.
          </p>
          <div className="modal-action">
            <form method="dialog">
              {/* Cancel button */}
              <button className="btn btn-ghost mr-2">Cancel</button>
            </form>
            {/* Confirm and delete button */}
            <button className="btn btn-error" onClick={confirmDelete}>
              Yes, Delete
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}

export default ProductCard;