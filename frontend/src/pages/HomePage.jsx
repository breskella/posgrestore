import { useEffect, useState, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useProductStore } from "../store/useProductStore";
import { PlusCircleIcon, RefreshCwIcon, SearchIcon, PackageIcon, HistoryIcon, ArrowUpDownIcon, DownloadIcon, FileTextIcon, ChevronDownIcon } from "lucide-react";
import ProductCard from "../components/ProductCard"; 
import AddProductModal from "../components/AddProductModal";
import StatsOverview from "../components/StatsOverview";
import ActivityLogsModal from "../components/ActivityLogsModal";

function HomePage() {
    // Extracting state, pagination info, facets, and methods from the global product store
    const { products, facets, pagination, loading, error, inventorySummary, fetchProducts, fetchLogs, exportProducts, exportPDF } = useProductStore(
        useShallow((state) => ({
            products: state.products,
            facets: state.facets,
            pagination: state.pagination,
            loading: state.loading,
            error: state.error,
            inventorySummary: state.inventorySummary,
            fetchProducts: state.fetchProducts,
            fetchLogs: state.fetchLogs,
            exportProducts: state.exportProducts,
            exportPDF: state.exportPDF,
        }))
    );
    
    // Local states for search input, category filtering, sorting, and dropdown visibility
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("newest"); // newest, oldest, price-asc, price-desc, stock
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const searchRef = useRef(null);
    const sortRef = useRef(null);
    const exportRef = useRef(null);

    useEffect(() => {
        const timeoutId = setTimeout(
            () => setDebouncedSearchTerm(searchTerm.trim()),
            searchTerm.trim() ? 300 : 0
        );
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const prevFiltersRef = useRef({ search: debouncedSearchTerm, category: selectedCategory, sort: sortBy });

    useEffect(() => {
        const filtersChanged =
            prevFiltersRef.current.search !== debouncedSearchTerm ||
            prevFiltersRef.current.category !== selectedCategory ||
            prevFiltersRef.current.sort !== sortBy;

        prevFiltersRef.current = { search: debouncedSearchTerm, category: selectedCategory, sort: sortBy };

        const pageToFetch = filtersChanged ? 1 : (pagination.currentPage || 1);
        fetchProducts(pageToFetch, { search: debouncedSearchTerm, category: selectedCategory, sort: sortBy });
    }, [debouncedSearchTerm, selectedCategory, sortBy, fetchProducts]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (sortRef.current && !sortRef.current.contains(event.target)) {
                setIsSortMenuOpen(false);
            }
            if (exportRef.current && !exportRef.current.contains(event.target)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Base static categories list
    const baseCategories = ["All", "Electronics", "Accessories", "Gadgets", "Low Stock", "Out of Stock"];

    // 1. Keep a persistent reference of facet counts so they don't get lost when filtering
    const persistedFacetMapRef = useRef(new Map());

    // Build current incoming facet map safely
    const currentFacetMap = new Map(
        Array.isArray(facets)
            ? facets.map((facet) => [String(facet.category ?? facet._id ?? "").trim().toLowerCase(), Number(facet.count ?? 0)])
            : []
    );

    // Merge incoming counts into our persistent map so we never lose counts of other categories when filtering
    currentFacetMap.forEach((count, key) => {
        if (count > 0) {
            persistedFacetMapRef.current.set(key, count);
        }
    });

    const categories = baseCategories.map((cat) => {
        const normalizedName = cat.trim().toLowerCase();
        let count = 0;

        if (cat === "All") {
            count = Number(inventorySummary.totalProducts || pagination.totalProducts || currentFacetMap.get("all") || persistedFacetMapRef.current.get("all") || 0);
        } else {
            // Try to get from current facets, fallback to persisted map, or check inventorySummary if available
            count = currentFacetMap.get(normalizedName) 
                 ?? persistedFacetMapRef.current.get(normalizedName) 
                 ?? (cat === "Low Stock" ? inventorySummary.lowStock : 0)
                 ?? (cat === "Out of Stock" ? inventorySummary.outOfStock : 0)
                 ?? 0;
        }

        return {
            name: cat,
            count: Number(count),
        };
    });

        

    const sortOptions = [
        { value: "newest", label: "Newest First" },
        { value: "oldest", label: "Oldest First" },
        { value: "price-asc", label: "Price: Low to High" },
        { value: "price-desc", label: "Price: High to Low" },
        { value: "stock", label: "Stock Quantity" },
    ];
    const activeSortLabel = sortOptions.find((option) => option.value === sortBy)?.label ?? "Newest First";

    // Keep sorting and filtering server-driven so it reflects the full dataset, not just the active page.
    const safeProducts = Array.isArray(products) ? products : [];

    // Filtered items for live search suggestions dropdown
    const searchSuggestions = searchTerm.trim() 
        ? safeProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5)
        : [];

    const firstResult = pagination.totalProducts === 0
        ? 0
        : (pagination.currentPage - 1) * pagination.limit + 1;
    const lastResult = Math.min(pagination.currentPage * pagination.limit, pagination.totalProducts);

    return (
        <main className="dashboard-page max-w-6xl mx-auto px-4 py-8">
            
            {/* Inventory statistics overview component passing full products list */}
            <StatsOverview
                totalProducts={inventorySummary.totalProducts || pagination.totalProducts}
                inventoryValue={inventorySummary.inventoryValue}
            />

            {/* Category and filter tabs with dynamic counts */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    {categories.map((catObj) => (
                        <button
                            key={catObj.name}
                            onClick={() => setSelectedCategory(catObj.name)}
                            className={`btn btn-sm ${selectedCategory === catObj.name ? "btn-primary" : "btn-ghost bg-base-100"}`}
                        >
                            {catObj.name}
                            {catObj.count > 0 && (
                                <span className={`ml-1.5 px-1.5 py-0.2 text-[10px] rounded-full ${selectedCategory === catObj.name ? "bg-primary-content text-primary" : "bg-base-300 text-base-content"}`}>
                                    {catObj.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

               {/* Sorting Dropdown Menu */}
                <div className="relative" ref={sortRef}>
                    <button
                        type="button"
                        onClick={() => setIsSortMenuOpen((prev) => !prev)}
                        className="theme-select-wrap flex items-center gap-2.5 bg-base-100 border border-base-300 hover:border-primary/50 rounded-xl px-4 py-2.5 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        aria-expanded={isSortMenuOpen}
                        aria-haspopup="true"
                    >
                        <ArrowUpDownIcon className="size-4 text-primary" />
                        <span className="text-xs text-base-content/60 font-medium">Sort by:</span>
                        <span className="text-sm font-semibold text-base-content">{activeSortLabel}</span>
                    </button>

                    {isSortMenuOpen && (
                        <div className="sort-dropdown-menu absolute right-0 top-full mt-2 min-w-56 bg-base-100 rounded-2xl border border-base-300/80 shadow-xl z-50 p-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                            {sortOptions.map((option) => {
                                const isSelected = sortBy === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            setSortBy(option.value);
                                            setIsSortMenuOpen(false);
                                        }}
                                            className={`sort-option w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm hover:text-base hover:text-primary transition-all duration-500 ease-in-out ${
                                            isSelected 
                                                ? "bg-primary text-primary-content font-semibold shadow-sm" 
                                                : "hover:bg-primary/10 hover:text-primary hover:text-[1rem] text-base-content font-medium"
                                        }`}
                                    >
                                        <span>{option.label}</span>
                                        {isSelected && (
                                            <span className="text-xs bg-primary-content/20 px-1.5 py-0.5 rounded-md font-bold">Active</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Top actions bar: Add Product button, Search bar, Activity Logs button, and Refresh button */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-8 sm:mb-12">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <button 
                        className="btn btn-primary flex-1 sm:flex-none" 
                        onClick={() => document.getElementById("add_product_modal").showModal()}
                    >
                        <PlusCircleIcon className="size-5 mr-2" />
                        Add Product
                    </button>

                    {/* Activity Logs Button */}
                    <button 
                        className="btn btn-outline btn-secondary flex-1 sm:flex-none gap-2" 
                        onClick={() => {
                            document.getElementById("activity_logs_modal").showModal();
                            fetchLogs();
                        }}
                    >
                        <HistoryIcon className="size-5" />
                        Activity Logs
                    </button>

                    {/* Export Dropdown Menu */}
                    <div className="relative" ref={exportRef}>
                        <button 
                            type="button"
                            className="btn btn-outline btn-accent flex-1 sm:flex-none gap-2" 
                            onClick={() => setIsExportMenuOpen((prev) => !prev)}
                            disabled={loading}
                            aria-expanded={isExportMenuOpen}
                            aria-haspopup="true"
                        >
                            <DownloadIcon className="size-5" />
                            <span>Export</span>
                            <ChevronDownIcon className={`size-4 transition-transform duration-200 ${isExportMenuOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isExportMenuOpen && (
                            <div className="export-dropdown-menu absolute left-0 sm:right-0 top-full mt-2 w-48 bg-base-100 rounded-2xl border border-base-300/80 shadow-xl z-50 p-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                                <button
                                    type="button"
                                    onClick={() => {
                                        exportProducts();
                                        setIsExportMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-sm hover:bg-accent/10 hover:text-accent font-medium text-base-content transition-colors duration-150"
                                >
                                    <DownloadIcon className="size-4 text-accent" />
                                    <span>Export as CSV</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        exportPDF();
                                        setIsExportMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-sm hover:bg-accent/10 hover:text-accent font-medium text-base-content transition-colors duration-150"
                                >
                                    <FileTextIcon className="size-4 text-accent" />
                                    <span>Export as PDF</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Debounced global search input with Live Suggestions Dropdown */}
                <div className="search-shell relative w-full sm:w-[360px]" ref={searchRef}>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 blur-sm" />
                    <div className="relative flex items-center gap-2 rounded-2xl border border-base-300/70 bg-base-100/90 px-3 py-2 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.5)] backdrop-blur-sm transition-all duration-200 focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <SearchIcon className="size-4" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="w-full border-0 bg-transparent px-1 py-2 text-sm text-base-content placeholder:text-base-content/45 focus:outline-none"
                            aria-label="Search products"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm("");
                                    setIsDropdownOpen(false);
                                }}
                                className="btn btn-ghost btn-xs rounded-full h-8 min-h-8 w-8 px-0 text-base-content/70 hover:text-base-content"
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {/* LIVE SEARCH SUGGESTIONS DROPDOWN */}
                    {isDropdownOpen && searchSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 mt-2 z-50 bg-base-100 border border-base-300 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
                            <div className="p-2 text-xs font-semibold text-base-content/50 border-b border-base-200">
                                Quick Suggestions
                            </div>
                            <div className="max-h-60 overflow-y-auto divide-y divide-base-200">
                                {searchSuggestions.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => {
                                            setSearchTerm(product.name);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="flex items-center gap-3 p-2.5 hover:bg-base-200/60 cursor-pointer transition-colors"
                                    >
                                        <img 
                                            src={product.image} 
                                            alt={product.name} 
                                            className="w-10 h-10 object-cover rounded-lg border border-base-300" 
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-base-content truncate">{product.name}</p>
                                            <p className="text-xs text-base-content/60">{product.category} • ${product.price}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    className="btn btn-ghost btn-circle hidden sm:flex"
                    onClick={() => fetchProducts(pagination.currentPage, { search: debouncedSearchTerm, category: selectedCategory, sort: sortBy }, true)}
                    disabled={loading}
                    aria-label="Refresh products"
                >
                    <RefreshCwIcon className="size-5" />
                </button>
            </div>

            {/* Modals */}
            <AddProductModal />
            <ActivityLogsModal />

            {/* Error alert banner if fetch fails */}
            {error && <div className="alert alert-error mb-8">{error}</div>}
            
            {/* Empty state when no products match the filter or inventory is empty */}
            {safeProducts.length === 0 && !loading && (
                <div className="flex flex-col justify-center items-center h-96 space-y-4">
                    <div className="bg-base-100 rounded-full p-6">
                        <PackageIcon className="size-12" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-semibold">No products found</h3>
                        <p className="text-gray-500 max-w-sm">
                            {searchTerm || selectedCategory !== "All" 
                                ? "Try changing your search or filter criteria" 
                                : "Get started by adding your first product to the inventory"}
                        </p>
                    </div>
                </div>
            )}

            {/* Loading spinner state */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Loading products" aria-busy="true">
                    {Array.from({ length: pagination.limit }, (_, index) => (
                        <div key={index} className="card bg-base-100 shadow-xl overflow-hidden">
                            <div className="skeleton h-48 w-full rounded-none" />
                            <div className="card-body gap-4">
                                <div className="skeleton h-4 w-20" />
                                <div className="skeleton h-6 w-3/4" />
                                <div className="skeleton h-8 w-1/2" />
                                <div className="flex justify-end gap-2">
                                    <div className="skeleton size-8" />
                                    <div className="skeleton size-8" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Products grid display */}
                    <div className="product-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {safeProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {pagination.totalProducts > 0 && (
                        <p className="text-center text-sm text-base-content/60 mt-6">
                            Showing {firstResult}-{lastResult} of {pagination.totalProducts} products
                        </p>
                    )}

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center mt-10 gap-2">
                            <button
                                className="btn btn-sm"
                                disabled={loading || pagination.currentPage === 1}
                                onClick={() => fetchProducts(pagination.currentPage - 1, { search: debouncedSearchTerm, category: selectedCategory, sort: sortBy })}
                            >
                                « Previous
                            </button>
                            
                            <span className="join-item px-4 text-sm font-medium">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>

                            <button
                                className="btn btn-sm"
                                disabled={loading || pagination.currentPage === pagination.totalPages}
                                onClick={() => fetchProducts(pagination.currentPage + 1, { search: debouncedSearchTerm, category: selectedCategory, sort: sortBy })}
                            >
                                Next »
                            </button>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}

export default HomePage;