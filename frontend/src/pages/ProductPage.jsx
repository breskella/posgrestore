import { useNavigate, useParams } from "react-router-dom";
import { useProductStore } from "../store/useProductStore";
import { useEffect } from "react";
import { ArrowLeftIcon, SaveIcon, Trash2Icon, AlertTriangleIcon, TagIcon, HashIcon, ImageIcon } from "lucide-react";

function ProductPage() {
  // Extracting state and methods from the global product store
  const {
    currentProduct,
    formData,
    setFormData,
    loading,
    error,
    fetchProduct,
    updateProduct,
    deleteProduct,
    pagination,
  } = useProductStore();
  
  const navigate = useNavigate();
  const { id } = useParams();

  // Fetch the specific product details when the component mounts or ID changes
  useEffect(() => {
    fetchProduct(id);
  }, [fetchProduct, id]);

  // Available categories for product classification
  const categories = ["Electronics", "Accessories", "Gadgets"];

  // Open the delete confirmation modal
  const openDeleteModal = () => {
    document.getElementById("delete_product_modal").showModal();
  };

  // Confirm and execute product deletion, then redirect to home
  const confirmDelete = async () => {
    await deleteProduct(id, pagination.currentPage);
    document.getElementById("delete_product_modal").close();
    navigate("/");
  };

  if (loading && !currentProduct) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back to home navigation button */}
      <button onClick={() => navigate("/")} className="btn btn-ghost mb-8">
        <ArrowLeftIcon className="size-4 mr-2" />
        Back to Products
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* PRODUCT IMAGE PREVIEW */}
        <div className="rounded-lg overflow-hidden shadow-lg bg-base-100 h-64 sm:h-80 md:h-96">
          <img
            src={
              formData.image instanceof File
                ? URL.createObjectURL(formData.image)
                : formData.image || currentProduct?.image
            }
            alt={currentProduct?.name}
            className="size-full object-cover"
          />
        </div>

        {/* EDIT PRODUCT FORM */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6">Edit Product</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProduct(id, pagination.currentPage).then((updatedProduct) => {
                  if (updatedProduct) navigate("/");
                });
              }}
              className="space-y-6"
            >
              {/* PRODUCT NAME INPUT */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base font-medium">Product Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  className="input input-bordered w-full"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* PRODUCT PRICE INPUT */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base font-medium">Price</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="input input-bordered w-full"
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              {/* PRODUCT COUNT / STOCK INPUT */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-base font-medium">Stock Count</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                    <HashIcon className="size-5" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="0"
                    className="input input-bordered w-full pl-10"
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
                <label className="label">
                  <span className="label-text text-base font-medium">Category</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                    <TagIcon className="size-5" />
                  </div>
                  <select
                    className="select select-bordered w-full pl-10 py-3 focus:select-primary transition-colors duration-200"
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
                <label className="label">
                  <span className="label-text text-base font-medium">Product Image</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                    <ImageIcon className="size-5" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="file-input file-input-bordered w-full pl-10 py-2 focus:file-input-primary transition-colors duration-200"
                    onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                  />
                </div>
              </div>

              {/* FORM ACTIONS */}
              <div className="flex justify-between items-center mt-8">
                <button type="button" onClick={openDeleteModal} className="btn btn-error">
                  <Trash2Icon className="size-4 mr-2" />
                  Delete Product
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !formData.name || !formData.price || !formData.category}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm mr-2" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="size-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <dialog id="delete_product_modal" className="modal">
        <div className="modal-box">
          <div className="flex items-center gap-3 text-error mb-4">
            <AlertTriangleIcon className="size-8" />
            <h3 className="font-bold text-lg">Are you sure?</h3>
          </div>
          <p className="py-2 text-base-content/70">
            You are about to delete <span className="font-semibold text-base-content">"{currentProduct?.name}"</span>. This action cannot be undone.
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost mr-2">Cancel</button>
            </form>
            <button className="btn btn-error" onClick={confirmDelete}>
              Yes, Delete
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}

export default ProductPage;