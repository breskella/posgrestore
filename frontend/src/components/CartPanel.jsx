import { Link } from "react-router-dom";
import { MinusIcon, PlusIcon, ShoppingCartIcon, Trash2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "../store/useCartStore";

function CartPanel({ fullPage = false, onClose }) {
  const {
    items,
    activeStore,
    totalItems,
    subtotal,
    loading,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCartStore();

  const content = items.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="size-16 rounded-2xl bg-base-200 flex items-center justify-center text-base-content/50">
        <ShoppingCartIcon className="size-7" />
      </div>
      <h3 className="mt-4 font-semibold text-lg">Your cart is empty</h3>
      <p className="mt-1 text-sm text-base-content/60">Explore a store and add something you love.</p>
      <Link to="/stores" onClick={onClose} className="btn btn-primary btn-sm mt-5">Explore stores</Link>
    </div>
  ) : (
    <>
      {activeStore && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-base-200/70 p-3 mb-4">
          <div className="min-w-0">
            <p className="text-xs text-base-content/55">Shopping from</p>
            <p className="font-semibold truncate">{activeStore.name}</p>
          </div>
          <Link to={`/stores/${activeStore.slug}`} onClick={onClose} className="btn btn-ghost btn-xs shrink-0">
            Visit store
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((item) => {
          const itemKey = item.item_id ?? item.product_id;
          const stock = Number(item.stock_count ?? item.count ?? 0);
          return (
            <li key={item.product_id} className="flex gap-3 rounded-xl border border-base-content/10 p-3">
              <img
                src={item.image_url || item.image || "https://placehold.co/120x120?text=Product"}
                alt=""
                className="size-20 rounded-lg object-cover bg-base-200 shrink-0"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight line-clamp-2">{item.name}</p>
                    <p className="mt-1 text-sm text-base-content/60">${Number(item.price).toFixed(2)} each</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-square btn-xs text-error shrink-0"
                    aria-label={`Remove ${item.name}`}
                    disabled={loading}
                    onClick={() => removeItem(itemKey)}
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <div className="join">
                    <button
                      type="button"
                      className="join-item btn btn-xs"
                      aria-label={`Decrease ${item.name} quantity`}
                      disabled={loading}
                      onClick={() => updateQuantity(itemKey, Number(item.quantity) - 1)}
                    >
                      <MinusIcon className="size-3.5" />
                    </button>
                    <span className="join-item btn btn-xs no-animation pointer-events-none">{item.quantity}</span>
                    <button
                      type="button"
                      className="join-item btn btn-xs"
                      aria-label={`Increase ${item.name} quantity`}
                      disabled={loading || Number(item.quantity) >= stock}
                      onClick={() => updateQuantity(itemKey, Number(item.quantity) + 1)}
                    >
                      <PlusIcon className="size-3.5" />
                    </button>
                  </div>
                  <span className="font-semibold">${Number(item.subtotal).toFixed(2)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex justify-end mt-3">
        <button type="button" className="btn btn-ghost btn-xs text-error" disabled={loading} onClick={clearCart}>
          Clear cart
        </button>
      </div>

      <div className="border-t border-base-content/10 mt-4 pt-4 space-y-3">
        <div className="flex justify-between text-sm text-base-content/65">
          <span>Total quantity</span>
          <span>{totalItems}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Subtotal</span>
          <span>${Number(subtotal).toFixed(2)}</span>
        </div>
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={() => toast("Checkout is coming in the next step.")}
        >
          Proceed to Checkout
        </button>
      </div>
    </>
  );

  if (fullPage) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="card bg-base-100 border border-base-content/10 shadow-sm">
          <div className="card-body p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="card-title text-2xl">Shopping Cart</h1>
                <p className="text-sm text-base-content/60">{totalItems} {totalItems === 1 ? "item" : "items"}</p>
              </div>
              {activeStore && (
                <Link to={`/stores/${activeStore.slug}`} className="btn btn-outline btn-sm">Continue shopping</Link>
              )}
            </div>
            <div className="mt-4">{content}</div>
          </div>
        </div>
      </main>
    );
  }

  return content;
}

export default CartPanel;
