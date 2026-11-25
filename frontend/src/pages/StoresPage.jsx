import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon, SearchIcon, StoreIcon } from "lucide-react";
import API from "../axios";

function StoreAvatar({ store, large = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const size = large ? "size-16 sm:size-20" : "size-14";

  if (store.logo_url && !imageFailed) {
    return (
      <img
        src={store.logo_url}
        alt={`${store.name} logo`}
        className={`${size} rounded-2xl object-cover bg-base-200`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className={`${size} rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl`}>
      {store.name?.trim().charAt(0).toUpperCase() || <StoreIcon className="size-7" />}
    </div>
  );
}

function StoresPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stores, setStores] = useState([]);
  const [error, setError] = useState("");
  const [errorRequestKey, setErrorRequestKey] = useState("");
  const [loadedRequestKey, setLoadedRequestKey] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const requestKey = `${debouncedSearch}:${retryToken}`;

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let active = true;

    API.get("/api/stores", { params: { search: debouncedSearch } })
      .then((response) => {
        if (!response.data?.success || !Array.isArray(response.data.data)) {
          throw new Error("The stores response was invalid");
        }
        if (active) {
          setStores(response.data.data);
          setError("");
          setErrorRequestKey("");
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || "Could not load stores. Please try again.");
          setErrorRequestKey(requestKey);
          setStores([]);
        }
      })
      .finally(() => {
        if (active) setLoadedRequestKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, retryToken, requestKey]);

  const loading = loadedRequestKey !== requestKey;
  const visibleError = errorRequestKey === requestKey ? error : "";

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-base-100 to-secondary/10 border border-base-content/10 px-6 py-10 sm:px-10 sm:py-14 mb-8 sm:mb-10">
        <div className="absolute -right-10 -top-14 size-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="badge badge-primary badge-outline gap-2 mb-4">
            <StoreIcon className="size-3.5" />
            Independent electronics retailers
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">Explore Electronics Stores</h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-base-content/65">
            Discover local storefronts, browse their collections, and find the gear that fits your life.
          </p>
          <label className="input input-bordered flex items-center gap-3 mt-7 max-w-2xl bg-base-100 shadow-sm">
            <SearchIcon className="size-5 text-base-content/50" />
            <input
              type="search"
              className="grow"
              placeholder="Search stores by name or description"
              aria-label="Search stores by name or description"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setSearch("")}>
                Clear
              </button>
            )}
          </label>
        </div>
      </section>

      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="text-xl sm:text-2xl font-semibold">Stores to explore</h2>
        {!loading && !visibleError && (
          <span className="text-sm text-base-content/60">{stores.length} {stores.length === 1 ? "store" : "stores"}</span>
        )}
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="card bg-base-100 border border-base-content/10 p-6 animate-pulse">
              <div className="flex gap-4"><div className="size-14 rounded-2xl bg-base-300" /><div className="space-y-2 flex-1"><div className="h-4 bg-base-300 rounded w-2/3" /><div className="h-3 bg-base-300 rounded w-1/3" /></div></div>
              <div className="h-14 bg-base-200 rounded mt-5" />
              <div className="h-10 bg-base-200 rounded mt-5" />
            </div>
          ))}
        </div>
      ) : visibleError ? (
        <div className="alert alert-error">
          <span>{visibleError}</span>
          <button type="button" className="btn btn-sm" onClick={() => setRetryToken((value) => value + 1)}>
            Retry
          </button>
        </div>
      ) : stores.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-base-content/20 bg-base-100 px-6 py-16 text-center">
          <div className="mx-auto size-14 rounded-2xl bg-base-200 flex items-center justify-center text-base-content/50">
            <SearchIcon className="size-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No stores found</h3>
          <p className="mt-1 text-sm text-base-content/60">
            {search ? "Try a different search term." : "There are no active electronics stores to show yet."}
          </p>
          {search && <button className="btn btn-ghost btn-sm mt-4" onClick={() => setSearch("")}>Clear search</button>}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <article key={store.id} className="card bg-base-100 border border-base-content/10 shadow-sm hover:shadow-lg transition-shadow">
              <div className="card-body p-5 sm:p-6">
                <div className="flex items-center gap-4">
                  <StoreAvatar store={store} />
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg truncate" title={store.name}>{store.name}</h3>
                    <span className="badge badge-ghost badge-sm mt-1">
                      {Number(store.product_count || 0)} {Number(store.product_count || 0) === 1 ? "product" : "products"}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-base-content/65 leading-relaxed mt-4 min-h-12 line-clamp-2">
                  {store.description?.trim() || "Browse a curated selection of electronics and accessories from this store."}
                </p>
                <div className="card-actions mt-5">
                  <Link to={`/stores/${store.slug}`} className="btn btn-primary btn-sm w-full gap-2">
                    Visit Store
                    <ArrowRightIcon className="size-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default StoresPage;
