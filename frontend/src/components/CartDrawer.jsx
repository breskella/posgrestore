import { Link } from "react-router-dom";
import { ArrowRightIcon, XIcon } from "lucide-react";
import { useCartStore } from "../store/useCartStore";
import CartPanel from "./CartPanel";

function CartDrawer() {
  const {
    drawerOpen,
    setDrawerOpen,
    pendingStoreConflict,
    confirmSwitchStoreAndAdd,
    dismissStoreConflict,
  } = useCartStore();

  return (
    <>
      {drawerOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close shopping cart"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-base-100 shadow-2xl">
            <header className="flex items-center justify-between gap-3 border-b border-base-content/10 px-5 py-4">
              <div>
                <h2 className="text-xl font-bold">Your Cart</h2>
                <p className="text-xs text-base-content/60">Review items before checkout</p>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/cart" className="btn btn-ghost btn-sm gap-1" onClick={() => setDrawerOpen(false)}>
                  Full cart <ArrowRightIcon className="size-4" />
                </Link>
                <button type="button" className="btn btn-ghost btn-square btn-sm" aria-label="Close cart" onClick={() => setDrawerOpen(false)}>
                  <XIcon className="size-5" />
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <CartPanel onClose={() => setDrawerOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {pendingStoreConflict && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-conflict-title"
            className="w-full max-w-md rounded-2xl bg-base-100 p-6 shadow-2xl"
          >
            <h2 id="store-conflict-title" className="text-xl font-bold">Switch stores?</h2>
            <p className="mt-2 text-sm text-base-content/70">
              Your cart has items from <strong>{pendingStoreConflict.activeStore?.name || "another store"}</strong>.
              A cart can only contain products from one store at a time. Clear it and add items from{" "}
              <strong>{pendingStoreConflict.incomingStore?.name || "this store"}</strong> instead?
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={dismissStoreConflict}>Keep current cart</button>
              <button type="button" className="btn btn-primary" onClick={confirmSwitchStoreAndAdd}>
                Clear cart and switch
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default CartDrawer;
