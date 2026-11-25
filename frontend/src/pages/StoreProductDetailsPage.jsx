import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeftIcon, PackageCheckIcon, ShoppingCartIcon, StoreIcon } from "lucide-react";
import API from "../axios";
import toast from "react-hot-toast";
import { useCartStore } from "../store/useCartStore";

function StoreProductDetailsPage() {
  const { slug, productId } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [errorRequestKey, setErrorRequestKey] = useState("");
  const [loadedRequestKey, setLoadedRequestKey] = useState("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const requestKey = `${slug}:${productId}`;

  useEffect(() => {
    let active = true;
    API.get(`/api/products/${encodeURIComponent(productId)}`, {
      params: { public: "true", storeSlug: slug },
    })
      .then((response) => {
        if (!response.data?.success || !response.data.data) throw new Error("The product response was invalid");
        if (active) {
          setProduct(response.data.data);
          setError("");
          setErrorRequestKey("");
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.status === 404 ? "This product is unavailable." : requestError.response?.data?.message || "Could not load this product.");
          setErrorRequestKey(requestKey);
          setProduct(null);
        }
      })
      .finally(() => {
        if (active) setLoadedRequestKey(requestKey);
      });
    return () => {
      active = false;
    };
  }, [productId, slug, requestKey]);

  const loading = loadedRequestKey !== requestKey;
  const visibleError = errorRequestKey === requestKey ? error : "";
  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><span className="loading loading-spinner loading-lg text-primary" /></div>;
  }

  if (!product) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="alert alert-error text-left mb-6">{visibleError || "This product is unavailable."}</div>
        <Link to={`/stores/${slug}`} className="btn btn-primary"><ArrowLeftIcon className="size-4" /> Back to store</Link>
      </main>
    );
  }

  const count = Number(product.count || 0);
  const description = product.description?.trim();
  const handleAddToCart = async () => {
    setAdding(true);
    const result = await addItem(product, 1);
    setAdding(false);
    if (result.success) {
      setAdded(true);
      toast.success(`${product.name} added to cart`);
      setTimeout(() => setAdded(false), 1400);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10">
      <Link to={`/stores/${slug}`} className="btn btn-ghost btn-sm gap-2 mb-5">
        <ArrowLeftIcon className="size-4" />
        Back to {product.store_name || "store"}
      </Link>
      <article className="grid gap-7 lg:grid-cols-2 items-start">
        <div className="overflow-hidden rounded-3xl bg-base-100 border border-base-content/10 shadow-sm">
          <img
            src={product.image || "https://placehold.co/900x700?text=Product"}
            alt={product.name}
            className="w-full aspect-[4/3] object-cover"
          />
        </div>
        <div className="card bg-base-100 border border-base-content/10 shadow-sm">
          <div className="card-body p-6 sm:p-8">
            <Link to={`/stores/${slug}`} className="link link-hover text-sm text-primary inline-flex items-center gap-2">
              <StoreIcon className="size-4" />
              {product.store_name}
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{product.name}</h1>
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-ghost">{product.category || "General"}</span>
              <span className={`badge gap-1 ${count > 0 ? "badge-success text-white" : "badge-error text-white"}`}>
                {count > 0 ? <><PackageCheckIcon className="size-3.5" /> In Stock ({count} left)</> : "Out of Stock"}
              </span>
            </div>
            <p className="text-3xl font-bold text-primary mt-2">${Number(product.price).toFixed(2)}</p>

            <div className="divider" />
            <section>
              <h2 className="font-semibold text-lg">Specifications &amp; Description</h2>
              <p className="mt-3 text-base-content/70 leading-relaxed whitespace-pre-line">
                {description || "The store has not provided additional product specifications."}
              </p>
            </section>
            <button type="button" className={`btn mt-5 ${added ? "btn-success" : "btn-primary"}`} disabled={count <= 0 || adding} onClick={handleAddToCart}>
              <ShoppingCartIcon className="size-4" />
              {adding ? "Adding..." : added ? "Added" : "Add to Cart"}
            </button>
          </div>
        </div>
      </article>
    </main>
  );
}

export default StoreProductDetailsPage;
