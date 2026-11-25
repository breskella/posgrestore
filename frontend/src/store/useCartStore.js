import { create } from "zustand";
import API from "../axios";
import toast from "react-hot-toast";

const GUEST_CART_KEY = "posgrestore.guestCart";

const readGuestItems = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.warn("Could not read the guest cart:", error);
    return [];
  }
};

const saveGuestItems = (items) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Could not save the guest cart:", error);
    toast.error("Your browser could not save the guest cart.");
  }
};

const removeGuestItems = () => {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch (error) {
    console.error("Could not clear the guest cart:", error);
  }
};

const normalizeProduct = (product, quantity = 1) => {
  const productId = Number(product.product_id ?? product.id ?? product.productId);
  const storeId = Number(product.store_id ?? product.storeId);
  return {
    item_id: product.item_id ?? product.itemId ?? null,
    product_id: productId,
    quantity: Number(quantity),
    name: product.name,
    price: Number(product.price),
    image_url: product.image_url ?? product.image ?? product.imageUrl ?? "",
    image: product.image ?? product.image_url ?? product.imageUrl ?? "",
    stock_count: Number(product.stock_count ?? product.count ?? product.stockCount ?? 0),
    count: Number(product.count ?? product.stock_count ?? product.stockCount ?? 0),
    category: product.category ?? "General",
    description: product.description ?? null,
    store_id: storeId,
    store_name: product.store_name ?? product.storeName ?? "",
    store_slug: product.store_slug ?? product.storeSlug ?? "",
    subtotal: Number(product.price) * Number(quantity),
  };
};

const shapeCart = (items, adjustments = []) => {
  const normalizedItems = items.map((item) => normalizeProduct(item, item.quantity));
  const firstItem = normalizedItems[0];
  return {
    items: normalizedItems,
    activeStore: firstItem
      ? { id: firstItem.store_id, name: firstItem.store_name, slug: firstItem.store_slug }
      : null,
    totalItems: normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: Number(normalizedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)),
    adjustments,
  };
};
const initialGuestCart = shapeCart(readGuestItems());

const storeDetailsFromProduct = (product) => ({
  id: Number(product.store_id ?? product.storeId),
  name: product.store_name ?? product.storeName ?? "Another store",
  slug: product.store_slug ?? product.storeSlug ?? "",
});

const setCartFromResponse = (set, response) => {
  const cart = response.data?.data;
  if (!cart || !Array.isArray(cart.items)) throw new Error("The cart response was invalid");
  set({
    items: cart.items.map((item) => normalizeProduct(item, item.quantity)),
    activeStore: cart.store ?? null,
    totalItems: Number(cart.totalItems ?? 0),
    subtotal: Number(cart.subtotal ?? 0),
    adjustments: Array.isArray(cart.adjustments) ? cart.adjustments : [],
    loading: false,
  });
  (cart.adjustments || []).forEach((message) => toast(message));
  return cart;
};

const errorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const setConflict = (set, error, product, quantity, kind = "add") => {
  set({
    pendingStoreConflict: {
      activeStore: error.response?.data?.activeStore ?? null,
      incomingStore: storeDetailsFromProduct(product),
      items: [{ productId: Number(product.product_id ?? product.id ?? product.productId), quantity }],
      product,
      kind,
    },
  });
};

export const useCartStore = create((set, get) => ({
  ...initialGuestCart,
  loading: false,
  drawerOpen: false,
  authUserId: null,
  pendingStoreConflict: null,

  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),

  onAuthenticated: async (user) => {
    const guestItems = readGuestItems();
    set({ authUserId: Number(user.id), loading: true, pendingStoreConflict: null });
    try {
      if (guestItems.length) {
        try {
          const response = await API.post("/api/cart/sync", {
            items: guestItems.map((item) => ({
              productId: Number(item.product_id ?? item.productId ?? item.id),
              quantity: Number(item.quantity),
            })),
          });
          setCartFromResponse(set, response);
          removeGuestItems();
          return;
        } catch (error) {
          if (error.response?.status === 409 && error.response?.data?.code === "DIFFERENT_STORE") {
            const incomingItems = guestItems.map((item) => ({
              productId: Number(item.product_id ?? item.productId ?? item.id),
              quantity: Number(item.quantity),
            }));
            set({
              pendingStoreConflict: {
                kind: "sync",
                items: incomingItems,
                activeStore: error.response.data.activeStore ?? null,
                incomingStore: storeDetailsFromProduct(guestItems[0]),
                product: guestItems[0],
              },
            });
          } else {
            console.error("Could not sync guest cart after authentication:", error);
            toast.error(errorMessage(error, "Could not sync your guest cart."));
          }
        }
      }

      const response = await API.get("/api/cart");
      setCartFromResponse(set, response);
      if (guestItems.length === 0) removeGuestItems();
    } catch (error) {
      console.error("Could not load authenticated cart:", error);
      set({ loading: false });
      toast.error(errorMessage(error, "Could not load your cart."));
    }
  },

  onLoggedOut: () => {
    const guestItems = readGuestItems().map((item) => normalizeProduct(item, item.quantity));
    const cart = shapeCart(guestItems);
    set({
      ...cart,
      authUserId: null,
      loading: false,
      drawerOpen: false,
      pendingStoreConflict: null,
    });
  },

  fetchCart: async () => {
    if (!get().authUserId) {
      const cart = shapeCart(readGuestItems());
      set({ ...cart, loading: false });
      return cart;
    }
    set({ loading: true });
    try {
      const response = await API.get("/api/cart");
      return setCartFromResponse(set, response);
    } catch (error) {
      set({ loading: false });
      console.error("Could not fetch cart:", error);
      toast.error(errorMessage(error, "Could not load your cart."));
      return null;
    }
  },

  addItem: async (product, quantity = 1) => {
    const productId = Number(product.product_id ?? product.id ?? product.productId);
    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      return { success: false, error: "Choose a valid product quantity." };
    }
    const stock = Number(product.stock_count ?? product.count ?? 0);
    if (stock <= 0) return { success: false, error: "This product is out of stock." };

    if (get().authUserId) {
      try {
        const response = await API.post("/api/cart/items", { productId, quantity: parsedQuantity });
        setCartFromResponse(set, response);
        return { success: true };
      } catch (error) {
        if (error.response?.status === 409 && error.response?.data?.code === "DIFFERENT_STORE") {
          setConflict(set, error, product, parsedQuantity);
          return { success: false, conflict: true };
        }
        const message = errorMessage(error, "Could not add product to cart.");
        toast.error(message);
        return { success: false, error: message };
      }
    }

    const items = readGuestItems().map((item) => normalizeProduct(item, item.quantity));
    const incomingStore = storeDetailsFromProduct(product);
    const activeStore = items.length ? storeDetailsFromProduct(items[0]) : null;
    if (activeStore && activeStore.id !== incomingStore.id) {
      set({
        pendingStoreConflict: {
          kind: "add",
          items: [{ productId, quantity: parsedQuantity }],
          activeStore,
          incomingStore,
          product,
        },
      });
      return { success: false, conflict: true };
    }

    const existing = items.find((item) => item.product_id === productId);
    const nextQuantity = Number(existing?.quantity ?? 0) + parsedQuantity;
    if (nextQuantity > stock) {
      const message = `Only ${stock} item(s) are currently available.`;
      toast.error(message);
      return { success: false, error: message };
    }

    const updatedItems = existing
      ? items.map((item) => item.product_id === productId ? normalizeProduct(product, nextQuantity) : item)
      : [...items, normalizeProduct(product, parsedQuantity)];
    saveGuestItems(updatedItems);
    set(shapeCart(updatedItems));
    return { success: true };
  },

  updateQuantity: async (itemIdOrProductId, quantity) => {
    const parsedId = Number(itemIdOrProductId);
    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedId) || !Number.isInteger(parsedQuantity)) {
      return { success: false, error: "Choose a valid quantity." };
    }

    if (get().authUserId) {
      try {
        const response = await API.patch(`/api/cart/items/${parsedId}`, { quantity: parsedQuantity });
        setCartFromResponse(set, response);
        return { success: true };
      } catch (error) {
        const message = errorMessage(error, "Could not update cart item.");
        toast.error(message);
        return { success: false, error: message };
      }
    }

    const items = readGuestItems().map((item) => normalizeProduct(item, item.quantity));
    const current = items.find((item) => item.product_id === parsedId || Number(item.item_id) === parsedId);
    if (!current) return { success: false, error: "Cart item not found." };
    const updatedItems = parsedQuantity <= 0
      ? items.filter((item) => item.product_id !== current.product_id)
      : items.map((item) => item.product_id === current.product_id
        ? { ...item, quantity: parsedQuantity, subtotal: item.price * parsedQuantity }
        : item);
    const target = updatedItems.find((item) => item.product_id === current.product_id);
    if (target && parsedQuantity > target.stock_count) {
      const message = `Only ${target.stock_count} item(s) are currently available.`;
      toast.error(message);
      return { success: false, error: message };
    }
    saveGuestItems(updatedItems);
    set(shapeCart(updatedItems));
    return { success: true };
  },

  removeItem: async (itemIdOrProductId) => {
    const parsedId = Number(itemIdOrProductId);
    if (get().authUserId) {
      try {
        const response = await API.delete(`/api/cart/items/${parsedId}`);
        setCartFromResponse(set, response);
        return { success: true };
      } catch (error) {
        const message = errorMessage(error, "Could not remove cart item.");
        toast.error(message);
        return { success: false, error: message };
      }
    }
    const items = readGuestItems().map((item) => normalizeProduct(item, item.quantity))
      .filter((item) => item.product_id !== parsedId && Number(item.item_id) !== parsedId);
    saveGuestItems(items);
    set(shapeCart(items));
    return { success: true };
  },

  clearCart: async () => {
    if (get().authUserId) {
      try {
        const response = await API.delete("/api/cart");
        setCartFromResponse(set, response);
      } catch (error) {
        console.error("Could not clear authenticated cart:", error);
        toast.error(errorMessage(error, "Could not clear cart."));
        return { success: false };
      }
    } else {
      removeGuestItems();
      set(shapeCart([]));
    }
    set({ pendingStoreConflict: null });
    return { success: true };
  },

  confirmSwitchStoreAndAdd: async () => {
    const conflict = get().pendingStoreConflict;
    if (!conflict) return { success: false };

    if (get().authUserId) {
      try {
        const response = await API.post("/api/cart/sync", {
          items: conflict.items,
          replaceStore: true,
        });
        setCartFromResponse(set, response);
        removeGuestItems();
        set({ pendingStoreConflict: null, drawerOpen: true });
        toast.success("Cart switched to the new store.");
        return { success: true };
      } catch (error) {
        const message = errorMessage(error, "Could not switch stores.");
        toast.error(message);
        return { success: false, error: message };
      }
    }

    const product = conflict.product;
    const quantity = Number(conflict.items[0]?.quantity ?? 1);
    const freshItem = normalizeProduct(product, quantity);
    saveGuestItems([freshItem]);
    set({ ...shapeCart([freshItem]), pendingStoreConflict: null, drawerOpen: true });
    toast.success("Cart switched to the new store.");
    return { success: true };
  },

  dismissStoreConflict: () => set({ pendingStoreConflict: null }),
}));
