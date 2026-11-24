import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCartIcon, ShoppingBagIcon, LogOutIcon, UserIcon } from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import { useAuthStore } from '../store/useAuthStore';
import { useProductStore } from '../store/useProductStore';
import toast from 'react-hot-toast';

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuthStore();
    const isAdmin = user?.role === 'store_admin' || user?.role === 'super_admin';
    const homePath = user ? (isAdmin ? '/dashboard' : '/stores') : '/';
    const isHomePage = location.pathname === '/' || location.pathname === '/dashboard';
    
    // Fetch products and pagination details from the global product store
    const { products, pagination } = useProductStore();

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
                <div className="navbar px-3 sm:px-6 min-h-[3.75rem] sm:min-h-[4rem] justify-between gap-2">
                    {/* LOGO */}
                    <div className="flex-1 lg:flex-none min-w-0">
                        <Link to={homePath} className="hover:opacity-80 transition-opacity inline-flex items-center">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <ShoppingCartIcon className="size-7 sm:size-8 md:size-9 text-primary shrink-0" />
                                <span
                                    className="font-semibold font-mono tracking-wider sm:tracking-widest text-lg sm:text-xl md:text-2xl 
                                    bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary truncate"
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
                    <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 shrink-0">
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

                        <ThemeSelector />

                        {isHomePage && isAdmin && (
                            <div className="indicator">
                                <div className="p-1.5 sm:p-2 rounded-full hover:bg-base-200 transition-colors cursor-pointer">
                                    <ShoppingBagIcon className="size-4 sm:size-5" />
                                    {/* Display real total products count from pagination or fallback to products length */}
                                    <span className="badge badge-xs sm:badge-sm badge-primary indicator-item">
                                        {pagination?.totalProducts || products.length}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="btn btn-xs sm:btn-sm btn-ghost text-error hover:bg-error/10 flex items-center gap-1 px-2"
                            title="Logout"
                        >
                            <LogOutIcon className="size-4 sm:size-5" />
                            <span className="hidden md:inline text-xs sm:text-sm">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Navbar;