import { DollarSignIcon, ImageIcon, Package2Icon, PlusCircleIcon, TagIcon, HashIcon } from "lucide-react";
import { useProductStore } from "../store/useProductStore";

function AddProductModal() {
  // Extracting state and methods from the global product store
  const { addProduct, formData, setFormData, loading } = useProductStore();

  // Available categories for product classification
  const categories = ["Electronics", "Accessories", "Gadgets"];

  // Helper to close modal
  const closeModal = () => {
    const modal = document.getElementById("add_product_modal");
    if (modal) modal.close();
  };

  return (
    <dialog id="add_product_modal" className="modal">
      <div className="modal-box w-11/12 max-w-lg p-5 sm:p-7 max-h-[90vh] overflow-y-auto">
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={closeModal}
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* MODAL HEADER */}
        <h3 className="font-bold text-lg sm:text-xl mb-6">Add New Product</h3>

        <form onSubmit={addProduct} className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-5">
            {/* PRODUCT NAME INPUT */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm sm:text-base font-medium">Product Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                  <Package2Icon className="size-4 sm:size-5" />
                </div>
                <input
                  type="text"
                  placeholder="Enter product name"
                  className="input input-bordered w-full pl-9 sm:pl-10 text-sm focus:input-primary transition-colors duration-200"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm sm:text-base font-medium">Description / Specifications</span>
              </label>
              <textarea
                className="textarea textarea-bordered min-h-24"
                maxLength={10000}
                placeholder="Add product details for shoppers"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* PRODUCT PRICE INPUT */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm sm:text-base font-medium">Price</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                  <DollarSignIcon className="size-4 sm:size-5" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="input input-bordered w-full pl-9 sm:pl-10 text-sm focus:input-primary transition-colors duration-200"
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>

            {/* PRODUCT COUNT / STOCK INPUT */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm sm:text-base font-medium">Stock Count</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                  <HashIcon className="size-4 sm:size-5" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="0"
                  className="input input-bordered w-full pl-9 sm:pl-10 text-sm focus:input-primary transition-colors duration-200"
                  value={formData.count !== undefined ? formData.count : ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      count: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* PRODUCT CATEGORY SELECT */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm sm:text-base font-medium">Category</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                  <TagIcon className="size-4 sm:size-5" />
                </div>
                <select
                  className="select select-bordered w-full pl-9 sm:pl-10 text-sm focus:select-primary transition-colors duration-200"
                  value={formData.category || ""}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PRODUCT IMAGE FILE INPUT */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm sm:text-base font-medium">Product Image</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                  <ImageIcon className="size-4 sm:size-5" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered w-full pl-9 sm:pl-10 text-sm focus:file-input-primary transition-colors duration-200"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                />
              </div>
            </div>
          </div>

          {/* MODAL ACTIONS */}
          <div className="modal-action mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="btn btn-ghost w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary w-full sm:w-auto sm:min-w-[120px]"
              disabled={!formData.name || !formData.price || formData.count === "" || !formData.category || !formData.image || loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <PlusCircleIcon className="size-5 mr-2" />
                  Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* BACKDROP */}
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}

export default AddProductModal;