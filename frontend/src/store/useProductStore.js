import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

// Base URL will be dynamic depending on the environment
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "";
const inFlightProductRequests = new Map();

/**
 * Normalize product object to ensure proper data types (e.g. numeric count).
 */
const normalizeProduct = (product) => ({
    ...product,
    count: Number(product.count ?? 0),
});

export const useProductStore = create((set, get) => ({
    // Products state & Pagination
    products: [],
    facets: [], // Added to support dynamic categories count (Facets)
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
        limit: 9,
    },
    loading: false,
    error: null,
    currentProduct: null,
    lastFetched: null,
    lastFetchedKey: null,
    activeFilters: { search: "", category: "All", sort: "newest" },
    inventorySummary: {
        totalProducts: 0,
        inventoryValue: 0,
    },
    productsRequestId: 0,

    // Activity logs state
    logs: [],
    loadingLogs: false,
    logsError: null,

    // Form state including category and count fields
    formData: {
        name: "",
        price: "",
        category: "",
        count: "",
        image: "",
    },

    // Set form data state
    setFormData: (formData) => set({ formData }),

    // Reset form data to default empty values including category and count
    resetForm: () => set({ formData: { name: "", price: "", category: "", count: "", image: "" } }),

    // Add a new product to the inventory using FormData for image upload
    addProduct: async (e) => {
        e.preventDefault();
        set({ loading: true });

        try {
            const { formData } = get();
            const token = useAuthStore.getState().token;

            // Construct FormData to support file upload
            const formDataObj = new FormData();
            formDataObj.append("name", formData.name);
            formDataObj.append("price", formData.price);
            formDataObj.append("category", formData.category);
            formDataObj.append("count", formData.count);
            if (formData.image) {
                formDataObj.append("image", formData.image);
            }

            await axios.post(`${BASE_URL}/api/products`, formDataObj, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const { pagination, activeFilters } = get();
            set({
                pagination: {
                    ...pagination,
                    currentPage: 1,
                },
                lastFetched: null,
                lastFetchedKey: null,
            });
            await get().fetchProducts(1, activeFilters, true);
            get().resetForm();
            toast.success("Product added successfully");
            document.getElementById("add_product_modal").close();
        } catch (error) {
            console.log("Error in addProduct function", error);
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            set({ loading: false });
        }
    },

    // Fetch paginated products from the server with frontend caching mechanism and facets support
    fetchProducts: async (page = 1, filters = get().activeFilters, forceRefresh = false) => {
        const state = get();
        const CACHE_DURATION = 60 * 1000;
        const now = Date.now();
        const search = typeof filters.search === "string" ? filters.search.trim() : "";
        const category = typeof filters.category === "string" ? filters.category : "All";
        const sort = ["newest", "oldest", "price-asc", "price-desc", "stock"].includes(filters.sort) ? filters.sort : "newest";
        const queryKey = `${page}:${search.toLowerCase()}:${category.toLowerCase()}:${sort}`;

        if (
            !forceRefresh &&
            state.products.length > 0 &&
            state.pagination.currentPage === page &&
            state.lastFetchedKey === queryKey &&
            state.lastFetched &&
            (now - state.lastFetched < CACHE_DURATION)
        ) {
            set({
                activeFilters: { search, category, sort },
                productsRequestId: state.productsRequestId + 1,
                loading: false,
            });
            return;
        }

        const inFlightRequest = inFlightProductRequests.get(queryKey);
        if (!forceRefresh && inFlightRequest?.requestId === state.productsRequestId) {
            set({ activeFilters: { search, category, sort } });
            return inFlightRequest.promise;
        }

        const requestId = state.productsRequestId + 1;
        set({
            loading: true,
            error: null,
            activeFilters: { search, category, sort },
            productsRequestId: requestId,
        });

        const request = (async () => {
            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(state.pagination.limit),
                    search,
                    category,
                    sort,
                });
                const response = await axios.get(`${BASE_URL}/api/products?${params.toString()}`);
                if (get().productsRequestId !== requestId) return;

                set({
                    products: response.data.data.map(normalizeProduct),
                    facets: response.data.facets || [],
                    inventorySummary: {
                        totalProducts: Number(response.data.summary?.totalProducts ?? response.data.pagination?.totalProducts ?? 0),
                        inventoryValue: Number(response.data.summary?.inventoryValue ?? 0),
                    },
                    pagination: response.data.pagination || state.pagination,
                    error: null,
                    lastFetched: Date.now(),
                    lastFetchedKey: queryKey,
                });
            } catch (err) {
                if (get().productsRequestId !== requestId) return;

                const hasExistingProducts = Array.isArray(get().products) && get().products.length > 0;
                if (hasExistingProducts) {
                    set({ error: null, loading: false });
                    return;
                }

                if (err.response?.status === 429) {
                    set({ error: "Rate limit exceeded", products: [], facets: [] });
                } else {
                    set({ error: "Something went wrong", products: [], facets: [] });
                }
            } finally {
                if (get().productsRequestId === requestId) set({ loading: false });
                if (inFlightProductRequests.get(queryKey)?.requestId === requestId) {
                    inFlightProductRequests.delete(queryKey);
                }
            }
        })();

        inFlightProductRequests.set(queryKey, { requestId, promise: request });
        return request;
    },

    // Delete a specific product by ID
    deleteProduct: async (id, targetPage) => {
        console.log("deleteProduct function called", id);
        set({ loading: true });
        try {
            const token = useAuthStore.getState().token;
            await axios.delete(`${BASE_URL}/api/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const { pagination, activeFilters, products } = get();
            const requestedPage = targetPage ?? pagination.currentPage ?? 1;
            const wasInCurrentResults = products.some((product) => Number(product.id) === Number(id));
            const totalProducts = Math.max(0, pagination.totalProducts - Number(wasInCurrentResults));
            const totalPages = Math.max(1, Math.ceil(totalProducts / pagination.limit));
            const page = Math.min(requestedPage, totalPages);
            set({
                pagination: { ...pagination, currentPage: page, totalProducts, totalPages },
                lastFetched: null,
                lastFetchedKey: null,
            });
            await get().fetchProducts(page, activeFilters, true);
            toast.success("Product deleted successfully");
        } catch (error) {
            console.log("Error in deleteProduct function", error);
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            set({ loading: false });
        }
    },


    // Clone an existing product by ID
    cloneProduct: async (id) => {
        set({ loading: true });
        try {
            const token = useAuthStore.getState().token;
            await axios.post(`${BASE_URL}/api/products/${id}/clone`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const { pagination, activeFilters } = get();
            set({
                lastFetched: null,
                lastFetchedKey: null,
            });
            await get().fetchProducts(pagination.currentPage, activeFilters, true);
            toast.success("Product cloned successfully");
        } catch (error) {
            console.log("Error in cloneProduct function", error);
            toast.error(error.response?.data?.message || "Could not clone product");
        } finally {
            set({ loading: false });
        }
    },

    // Fetch a single product details by ID for editing
    fetchProduct: async (id) => {
        set({
            loading: true,
            currentProduct: null,
            formData: { name: "", price: "", category: "", count: "", image: "" },
            error: null,
        });
        try {
            const response = await axios.get(`${BASE_URL}/api/products/${id}`);
            const product = normalizeProduct(response.data.data);
            set({
                currentProduct: product,
                formData: product,
                error: null,
            });
        } catch (error) {
            console.log("Error in fetchProduct function", error);
            set({ error: "Something went wrong", currentProduct: null });
        } finally {
            set({ loading: false });
        }
    },

    // Update an existing product using FormData for image upload with Optimistic UI Updates
    updateProduct: async (id, targetPage) => {
        set({ loading: true });
        const { formData, products, currentProduct, pagination, activeFilters } = get();
        const token = useAuthStore.getState().token;
        const currentPage = targetPage ?? pagination.currentPage ?? 1;

        // Backup state for rollback in case of error
        const previousProducts = [...products];
        const previousCurrentProduct = currentProduct ? { ...currentProduct } : null;
        const previousFormData = { ...formData };

        // Generate instant preview image URL (Blob object URL if local File, otherwise string URL)
        const optimisticImageUrl = formData.image instanceof File
            ? URL.createObjectURL(formData.image)
            : (formData.image || currentProduct?.image);

        // Construct optimistic product model
        const optimisticProduct = normalizeProduct({
            ...currentProduct,
            ...formData,
            id: Number(id),
            image: optimisticImageUrl,
            count: Number(formData.count ?? 0),
            price: Number(formData.price ?? 0),
        });

        // Apply instant optimistic store update
        const updatedProductsList = products.map((p) =>
            Number(p.id) === Number(id) ? optimisticProduct : p
        );

        set({
            currentProduct: optimisticProduct,
            formData: optimisticProduct,
            products: updatedProductsList,
            error: null,
        });

        try {
            // Construct FormData for API update
            const formDataObj = new FormData();
            formDataObj.append("name", formData.name);
            formDataObj.append("price", formData.price);
            formDataObj.append("category", formData.category);
            formDataObj.append("count", Number(formData.count));
            if (formData.image instanceof File) {
                formDataObj.append("image", formData.image);
            } else if (typeof formData.image === "string" && formData.image) {
                formDataObj.append("image", formData.image);
            }

            const response = await axios.put(`${BASE_URL}/api/products/${id}`, formDataObj, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const serverUpdatedProduct = normalizeProduct(response.data.data);

            const syncedProductsList = get().products.map((p) =>
                Number(p.id) === Number(id) ? serverUpdatedProduct : p
            );

            set({
                currentProduct: serverUpdatedProduct,
                formData: serverUpdatedProduct,
                products: syncedProductsList,
                error: null,
                lastFetched: null,
                lastFetchedKey: null,
            });

            // Re-fetch current page data in background to ensure total facets & counts are synced
            get().fetchProducts(currentPage, activeFilters, true);

            toast.success("Product updated successfully");
            return serverUpdatedProduct;
        } catch (error) {
            console.log("Error in updateProduct function", error);
            // Rollback optimistic changes on error
            set({
                products: previousProducts,
                currentProduct: previousCurrentProduct,
                formData: previousFormData,
            });
            toast.error(error.response?.data?.message || "Could not update product");
            return null;
        } finally {
            set({ loading: false });
        }
    },

    // Fetch system activity logs history
    fetchLogs: async () => {
        set({ loadingLogs: true, logsError: null });
        try {
            const response = await axios.get(`${BASE_URL}/api/products/logs`);
            const logs = response.data?.data;
            if (!Array.isArray(logs)) {
                throw new Error("The activity logs response is invalid");
            }
            set({ logs, loadingLogs: false, logsError: null });
        } catch (error) {
            console.log("Error fetching activity logs:", error);
            set({
                loadingLogs: false,
                logsError: error.response?.data?.message || "Could not load activity logs",
            });
        }
    },

    // Export products to CSV file download
    exportProducts: async () => {
        const state = get();
        const { search, category, sort } = state.activeFilters;
        try {
            const params = new URLSearchParams({
                page: "1",
                limit: "5000",
                search: search || "",
                category: category || "All",
                sort: sort || "newest",
            });
            const response = await axios.get(`${BASE_URL}/api/products?${params.toString()}`);
            const exportData = response.data?.data || state.products;

            if (!Array.isArray(exportData) || exportData.length === 0) {
                toast.error("No products available to export");
                return;
            }

            const headers = ["Product Name", "Category", "Price ($)", "Stock Count", "Status"];
            const rows = exportData.map((p) => {
                const count = Number(p.count ?? 0);
                const status = count === 0 ? "Out of Stock" : count < 5 ? "Low Stock" : "In Stock";
                const safeName = `"${String(p.name || "").replace(/"/g, '""')}"`;
                const safeCategory = `"${String(p.category || "General").replace(/"/g, '""')}"`;
                const price = Number(p.price || 0).toFixed(2);
                return [safeName, safeCategory, price, count, `"${status}"`].join(",");
            });

            // Prepend UTF-8 BOM (\uFEFF) for Excel compatibility
            const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "products_export.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("Products exported to products_export.csv successfully");
        } catch (error) {
            console.error("Export CSV error:", error);
            toast.error("Failed to export product data");
        }
    },

    // Export products as printable PDF report
    exportPDF: async () => {
        const state = get();
        const { search, category, sort } = state.activeFilters;
        try {
            const params = new URLSearchParams({
                page: "1",
                limit: "5000",
                search: search || "",
                category: category || "All",
                sort: sort || "newest",
            });
            const response = await axios.get(`${BASE_URL}/api/products?${params.toString()}`);
            const exportData = response.data?.data || state.products;

            if (!Array.isArray(exportData) || exportData.length === 0) {
                toast.error("No products available to export");
                return;
            }

            const totalProducts = exportData.length;
            const totalValue = exportData.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.count || 0)), 0);
            const dateStr = new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });

            const rowsHtml = exportData.map((p, index) => {
                const count = Number(p.count ?? 0);
                const status = count === 0 ? "Out of Stock" : count < 5 ? "Low Stock" : "In Stock";
                const statusColor = count === 0 ? "#ef4444" : count < 5 ? "#d97706" : "#059669";
                const priceFormatted = `$${Number(p.price || 0).toFixed(2)}`;
                
                return `
                    <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 14px; font-weight: 600; color: #0f172a;">${p.name}</td>
                        <td style="padding: 10px 14px; color: #475569;">${p.category || "General"}</td>
                        <td style="padding: 10px 14px; font-weight: 600; color: #0f172a; text-align: right;">${priceFormatted}</td>
                        <td style="padding: 10px 14px; text-align: center; font-weight: 500; color: #334155;">${count}</td>
                        <td style="padding: 10px 14px; text-align: center;">
                            <span style="display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; color: ${statusColor}; background-color: ${statusColor}18; border: 1px solid ${statusColor}35;">
                                ${status}
                            </span>
                        </td>
                    </tr>
                `;
            }).join("");

            const printHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8" />
                    <title>Products Inventory Report</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                            color: #0f172a;
                            margin: 0;
                            padding: 32px;
                            background: #ffffff;
                        }
                        .header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            border-bottom: 2px solid #4f46e5;
                            padding-bottom: 16px;
                            margin-bottom: 24px;
                        }
                        .title {
                            font-size: 24px;
                            font-weight: 800;
                            color: #1e1b4b;
                            margin: 0;
                        }
                        .subtitle {
                            font-size: 13px;
                            color: #64748b;
                            margin-top: 4px;
                        }
                        .summary-cards {
                            display: flex;
                            gap: 16px;
                            margin-bottom: 24px;
                        }
                        .card {
                            flex: 1;
                            background: #f8fafc;
                            border: 1px solid #e2e8f0;
                            border-radius: 10px;
                            padding: 14px 18px;
                        }
                        .card-label {
                            font-size: 11px;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            color: #64748b;
                            font-weight: 700;
                        }
                        .card-value {
                            font-size: 20px;
                            font-weight: 800;
                            color: #0f172a;
                            margin-top: 4px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 12px;
                            font-size: 13px;
                        }
                        th {
                            background-color: #4f46e5;
                            color: #ffffff;
                            text-align: left;
                            padding: 12px 14px;
                            font-weight: 700;
                            text-transform: uppercase;
                            font-size: 11px;
                            letter-spacing: 0.05em;
                        }
                        th:nth-child(3), th:nth-child(4), th:nth-child(5) {
                            text-align: center;
                        }
                        th:nth-child(3) {
                            text-align: right;
                        }
                        @media print {
                            body { padding: 0; }
                            @page { margin: 1.5cm; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1 class="title">POSGRESTORE Inventory Report</h1>
                            <div class="subtitle">Filtered Product Summary & Stock Details</div>
                        </div>
                        <div style="text-align: right; font-size: 12px; color: #64748b;">
                            <div><strong>Generated:</strong> ${dateStr}</div>
                            <div><strong>Category:</strong> ${category} | <strong>Search:</strong> "${search || "All"}"</div>
                        </div>
                    </div>

                    <div class="summary-cards">
                        <div class="card">
                            <div class="card-label">Total Filtered Products</div>
                            <div class="card-value">${totalProducts}</div>
                        </div>
                        <div class="card">
                            <div class="card-label">Total Estimated Inventory Value</div>
                            <div class="card-value">$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Price ($)</th>
                                <th>Stock</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>

                    <script>
                        window.onload = function() {
                            window.print();
                        };
                    </script>
                </body>
                </html>
            `;

            const printWindow = window.open("", "_blank");
            if (!printWindow) {
                toast.error("Please allow popups to generate the PDF report");
                return;
            }

            printWindow.document.open();
            printWindow.document.write(printHtml);
            printWindow.document.close();

            toast.success("PDF Print dialog opened");
        } catch (error) {
            console.error("Export PDF error:", error);
            toast.error("Failed to generate PDF report");
        }
    },
}));