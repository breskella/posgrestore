import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCartIcon, LogOutIcon, UserIcon, StoreIcon } from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import toast from 'react-hot-toast';

function Navbar() {
    const navigate = useNavigate();
    const { logout, user } = useAuthStore();
    const isAdmin = user?.role === 'store_admin' || user?.role === 'super_admin';
    const homePath = user ? (isAdmin ? '/dashboard' : '/stores') : '/';
    const { totalItems: cartCount, setDrawerOpen } = useCartStore();

    const handleLogout = async () => {
        const result = await logout();
        if (!result.success) {
            toast.error('Could not contact the server to clear your session.');
        }
        navigate('/', { replace: true });
    };

    return (
        <div className="bg-base-100/80 backdrop-blur-lg border-b border-base-content/10 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto">
                <div className="navbar px-3 sm:px-6 min-h-[3.75rem] sm:min-h-[4rem] justify-between gap-2 sm:gap-4">
                    {/* LOGO */}
                    <div className="flex-1 min-w-0">
                        <Link to={homePath} className="hover:opacity-80 transition-opacity inline-flex min-w-0 items-center">
                            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                                <ShoppingCartIcon className="size-7 sm:size-8 md:size-9 text-primary shrink-0" />
                                <span
                                    className="whitespace-nowrap truncate font-semibold font-mono tracking-normal sm:tracking-wider md:tracking-widest text-base sm:text-lg md:text-2xl
                                    bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
                                >
                                    POSGRESTORE
                                </span>
                                {user?.store?.storeName && (
                                    <span className="badge badge-primary badge-outline badge-xs sm:badge-sm hidden md:inline-flex">
                                        {user.store.storeName}
                                    </span>
                                )}
                                {user?.role === 'customer' && (
                                    <span className="badge badge-secondary badge-outline badge-xs sm:badge-sm hidden md:inline-flex">
                                        Shopper
                                    </span>
                                )}
                            </div>
                        </Link>
                    </div>

                    {/* RIGHT SECTION */}
                    <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
                        {user && (
                            <Link
                                to="/profile"
                                className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity p-1 sm:px-2 sm:py-1 rounded-lg hover:bg-base-200"
                                title="View Profile"
                            >
                                <div className="size-7 sm:size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <UserIcon className="size-3.5 sm:size-4" />
                                </div>
                                <span className="text-xs sm:text-sm font-medium hidden sm:inline text-base-content/70 max-w-[100px] truncate">
                                    {user.username}
                                </span>
                            </Link>
                        )}

                        <Link to="/stores" className="btn btn-ghost btn-xs sm:btn-sm gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
                            <StoreIcon className="size-4" />
                            <span className="hidden sm:inline">Browse Stores</span>
                        </Link>

                        <button
                            type="button"
                            className="btn btn-ghost btn-square btn-sm sm:btn-md indicator shrink-0"
                            aria-label={`Open shopping cart, ${cartCount} items`}
                            onClick={() => setDrawerOpen(true)}
                        >
                            <ShoppingCartIcon className="size-5" />
                            <span className="badge badge-xs badge-primary indicator-item">{cartCount}</span>
                        </button>

                        {user?.role === 'store_admin' && user.store?.storeSlug && (
                            <Link to={`/stores/${user.store.storeSlug}`} className="btn btn-outline btn-primary btn-xs sm:btn-sm gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
                                <StoreIcon className="size-4" />
                                <span className="hidden md:inline">View My Storefront</span>
                            </Link>
                        )}

                        <div className="shrink-0">
                            <ThemeSelector />
                        </div>

                        {user ? (
                            <button
                                onClick={handleLogout}
                                className="btn btn-xs sm:btn-sm btn-ghost text-error hover:bg-error/10 flex items-center gap-1 px-2"
                                title="Logout"
                            >
                                <LogOutIcon className="size-4 sm:size-5" />
                                <span className="hidden md:inline text-xs sm:text-sm">Logout</span>
                            </button>
                        ) : (
                            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                                <Link to="/login" className="btn btn-ghost btn-xs sm:btn-sm whitespace-nowrap px-2">Log in</Link>
                                <Link to="/signup" className="btn btn-primary btn-xs sm:btn-sm whitespace-nowrap px-2">Sign up</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Navbar;