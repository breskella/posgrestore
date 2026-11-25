import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowUpDownIcon,
  PackageIcon,
  SearchIcon,
  ShoppingCartIcon,
  StoreIcon,
} from "lucide-react";
import API from "../axios";
import { useCartStore } from "../store/useCartStore";
import toast from "react-hot-toast";

const PAGE_SIZE = 12;

function StoreLogo({ store }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (store.logo_url && !imageFailed) {
    return (
      <img
        src={store.logo_url}
        alt={`${store.name} logo`}
        className="size-20 sm:size-24 rounded-3xl object-cover bg-base-200 shadow-lg"
        onError={() => setImageFailed(true)}
      />
    );
  }
  return (
    <div className="size-20 sm:size-24 rounded-3xl bg-primary text-primary-content flex items-center justify-center text-3xl font-bold shadow-lg">
      {store.name?.trim().charAt(0).toUpperCase() || <StoreIcon className="size-9" />}
    </div>
  );
}

function StorefrontPage() {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [storeError, setStoreError] = useState("");
  const [storeErrorSlug, setStoreErrorSlug] = useState("");
  const [loadedStoreSlug, setLoadedStoreSlug] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalProducts: 0 });
  const [productsError, setProductsError] = useState("");
  const [productsErrorKey, setProductsErrorKey] = useState("");
  const [loadedProductsKey, setLoadedProductsKey] = useState("");
  const [addingProductId, setAddingProductId] = useState(null);
  const [addedProductId, setAddedProductId] = useState(null);
  const addItem = useCartStore((state) => state.addItem);
  const productsRequestKey = JSON.stringify([slug, debouncedSearch, category, inStockOnly, sort, page]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let active = true;
    API.get(`/api/stores/${encodeURIComponent(slug)}`)
      .then((response) => {
        if (!response.data?.success || !response.data.data) throw new Error("The store response was invalid");
        if (active) {
          setStore(response.data.data);
          setStoreError("");
          setStoreErrorSlug("");
        }
      })
      .catch((error) => {
        if (active) {
          setStoreError(error.response?.status === 404 ? "This store is unavailable." : error.response?.data?.message || "Could not load this store.");
          setStoreErrorSlug(slug);
          setStore(null);
        }
      })
      .finally(() => {
        if (active) setLoadedStoreSlug(slug);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    let active = true;
    API.get("/api/products", {
      params: {
        storeSlug: slug,
        public: "true",
        search: debouncedSearch,
        category,
        inStockOnly: inStockOnly ? "true" : undefined,
        sort,
        page,
        limit: PAGE_SIZE,
      },
    })
      .then((response) => {
        if (!response.data?.success || !Array.isArray(response.data.data)) {
          throw new Error("The products response was invalid");
        }
        if (active) {
          setProducts(response.data.data);
          setPagination(response.data.pagination || { currentPage: 1, totalPages: 1, totalProducts: 0 });
          setProductsError("");
          setProductsErrorKey("");
        }
      })
      .catch((error) => {
        if (active) {
          setProducts([]);
          setProductsError(error.response?.status === 404 ? "This store is unavailable." : error.response?.data?.message || "Could not load products. Please try again.");
          setProductsErrorKey(productsRequestKey);
        }
      })
      .finally(() => {
        if (active) setLoadedProductsKey(productsRequestKey);
      });
    return () => {
      active = false;
    };
  }, [slug, debouncedSearch, category, inStockOnly, sort, page, productsRequestKey]);

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setInStockOnly(false);
    setSort("newest");
    setPage(1);
  };

  const handleAddToCart = async (product) => {
    setAddingProductId(product.id);
    const result = await addItem({ ...product, store_id: store.id, store_name: store.name, store_slug: store.slug });
    setAddingProductId(null);
    if (result.success) {
      setAddedProductId(product.id);
      toast.success(`${product.name} added to cart`);
      setTimeout(() => setAddedProductId((current) => current === product.id ? null : current), 1400);
    }
  };

  const storeLoading = loadedStoreSlug !== slug;
  const productsLoading = loadedProductsKey !== productsRequestKey;
  const visibleStoreError = storeErrorSlug === slug ? storeError : "";
  const visibleProductsError = productsErrorKey === productsRequestKey ? productsError : "";

  if (storeLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><span className="loading loading-spinner loading-lg text-primary" /></div>;
  }

  if (!store) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="alert alert-error text-left mb-6">{visibleStoreError || "This store is unavailable."}</div>
        <Link to="/stores" className="btn btn-primary"><ArrowLeftIcon className="size-4" /> Explore stores</Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10">
      <Link to="/stores" className="btn btn-ghost btn-sm gap-2 mb-5">
        <ArrowLeftIcon className="size-4" />
        All stores
      </Link>

      <section className="rounded-3xl border border-base-content/10 bg-base-100 p-6 sm:p-9 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
          <StoreLogo store={store} />
          <div className="flex-1 min-w-0">
            <span className="badge badge-primary badge-outline mb-2">Electronics Store</span>
            <h1 className="text-3xl sm:text-4xl font-bold">{store.name}</h1>
            <p className="mt-2 text-base-content/65 max-w-3xl whitespace-pre-line">
              {store.description?.trim() || "Explore this store's latest electronics and accessories."}
            </p>
            <span className="badge badge-ghost gap-2 mt-4 py-3">
              <PackageIcon className="size-4" />
              {Number(store.product_count || 0)} {Number(store.product_count || 0) === 1 ? "product" : "products"}
            </span>
          </div>
        </div>
      </section>

      <section aria-label="Filter products" className="rounded-2xl bg-base-100 border border-base-content/10 p-4 sm:p-5 mb-6">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_200px_220px] md:items-center">
          <label className="input input-bordered flex items-center gap-2">
            <SearchIcon className="size-4 text-base-content/50" />
            <input
              type="search"
              className="grow"
              placeholder="Search this store"
              aria-label="Search products in this store"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            className="select select-bordered w-full"
            aria-label="Filter by category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="All">All categories</option>
            {(store.categories || []).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <label className="select select-bordered flex items-center gap-2">
            <ArrowUpDownIcon className="size-4 text-base-content/50" />
            <select className="grow" aria-label="Sort products" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <label className="label cursor-pointer justify-start gap-3 py-0">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm"
              checked={inStockOnly}
              onChange={(event) => {
                setInStockOnly(event.target.checked);
                setPage(1);
              }}
            />
            <span className="label-text">In Stock Only</span>
          </label>
          {(search || category !== "All" || inStockOnly || sort !== "newest") && (
            <button type="button" className="btn btn-ghost btn-xs" onClick={resetFilters}>Reset filters</button>
          )}
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold">Store products</h2>
        {!productsLoading && <span className="text-sm text-base-content/60">{pagination.totalProducts || 0} items</span>}
      </div>

      {visibleProductsError ? (
        <div className="alert alert-error">{visibleProductsError}</div>
      ) : productsLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="card bg-base-100 h-80 animate-pulse"><div className="h-44 bg-base-300" /><div className="card-body"><div className="h-4 bg-base-300 rounded" /><div className="h-4 bg-base-200 rounded w-1/2" /></div></div>)}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-base-content/20 bg-base-100 px-6 py-14 text-center">
          <PackageIcon className="size-8 mx-auto text-base-content/40" />
          <h3 className="mt-3 text-lg font-semibold">No products match these filters</h3>
          <p className="mt-1 text-sm text-base-content/60">Try another search or clear the selected filters.</p>
          <button type="button" className="btn btn-outline btn-sm mt-4" onClick={resetFilters}>Clear filters</button>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const count = Number(product.count || 0);
              return (
                <article key={product.id} className="card product-card bg-base-100 border border-base-content/10 overflow-hidden">
                  <figure className="relative h-52 bg-base-200">
                    <img src={product.image || "https://placehold.co/600x400?text=Product"} alt={product.name} className="product-card-image size-full object-cover" loading="lazy" />
                    <span className={`badge absolute top-3 right-3 font-medium ${count > 0 ? "badge-success text-white" : "badge-error text-white"}`}>
                      {count > 0 ? `In Stock (${count} left)` : "Out of Stock"}
                    </span>
                  </figure>
                  <div className="card-body p-4 flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-lg leading-tight line-clamp-2">{product.name}</h3>
                      <span className="badge badge-ghost badge-sm shrink-0">{product.category || "General"}</span>
                    </div>
                    <p className="text-2xl font-bold text-primary mt-2">${Number(product.price).toFixed(2)}</p>
                    <div className="card-actions mt-auto pt-3">
                      <Link to={`/stores/${store.slug}/products/${product.id}`} className="btn btn-outline btn-sm flex-1">View Details</Link>
                      <button
                        type="button"
                        className={`btn btn-sm flex-1 ${addedProductId === product.id ? "btn-success" : "btn-primary"}`}
                        disabled={count <= 0 || addingProductId === product.id}
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCartIcon className="size-4" />
                        {addingProductId === product.id ? "Adding..." : addedProductId === product.id ? "Added" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {pagination.totalPages > 1 && (
            <div className="join flex justify-center mt-8">
              <button className="join-item btn btn-sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>«</button>
              <span className="join-item btn btn-sm no-animation">Page {page} of {pagination.totalPages}</span>
              <button className="join-item btn btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>»</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default StorefrontPage;
