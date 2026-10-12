import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCartIcon, ShoppingBagIcon, LogOutIcon, UserIcon } from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import { useAuthStore } from '../store/useAuthStore';
import { useProductStore } from '../store/useProductStore';

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const isHomePage = location.pathname === '/';
    const { logout, user } = useAuthStore();
    
    // Fetch products and pagination details from the global product store
    const { products, pagination } = useProductStore();

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    return (
        <div className="bg-base-100/80 backdrop-blur-lg border-b border-base-content/10 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto">
                <div className="navbar px-4 min-h-[4rem] justify-between">
                    {/* LOGO */}
                    <div className="flex-1 lg:flex-none">
                        <Link to="/" className="hover:opacity-80 transition-opacity">
                            <div className="flex items-center gap-2">
                                <ShoppingCartIcon className="size-9 text-primary" />
                                <span
                                    className="font-semibold font-mono tracking-widest text-2xl 
                                    bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
                                >
                                    POSGRESTORE
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* RIGHT SECTION */}
                    <div className="flex items-center gap-4">
                        {user && (
                            <Link
                                to="/profile"
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity px-2 py-1 rounded-lg hover:bg-base-200"
                                title="View Profile"
                            >
                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <UserIcon className="size-4" />
                                </div>
                                <span className="text-sm font-medium hidden sm:inline text-base-content/70">
                                    {user.username}
                                </span>
                            </Link>
                        )}

                        <ThemeSelector />

                        {isHomePage && (
                            <div className="indicator">
                                <div className="p-2 rounded-full hover:bg-base-200 transition-colors cursor-pointer">
                                    <ShoppingBagIcon className="size-5" />
                                    {/* Display real total products count from pagination or fallback to products length */}
                                    <span className="badge badge-sm badge-primary indicator-item">
                                        {pagination?.totalProducts || products.length}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="btn btn-sm btn-ghost text-error hover:bg-error/10 flex items-center gap-1.5"
                            title="Logout"
                        >
                            <LogOutIcon className="size-5" />
                            <span className="hidden md:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Navbar;