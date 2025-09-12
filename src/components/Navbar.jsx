import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    ShoppingBagIcon, 
    DocumentTextIcon, 
    CubeIcon, 
    ShoppingCartIcon,
    Bars3Icon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { path: '/', label: 'Products', icon: ShoppingBagIcon },
        { path: '/checkout', label: 'Checkout', icon: ShoppingCartIcon },
        { path: '/bills', label: 'Bills', icon: DocumentTextIcon },
        { path: '/inventory', label: 'Inventory', icon: CubeIcon }
    ];

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Close mobile menu on window resize to desktop size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <nav className="sticky top-0 z-50 bg-green-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-3 sm:py-4">
                    {/* Logo/Brand - Responsive */}
                    <Link 
                        to="/" 
                        className="text-white font-bold text-lg sm:text-xl lg:text-2xl flex-shrink-0"
                        onClick={closeMobileMenu}
                    >
                        <span className="hidden sm:inline">Ramji Electrical Shop</span>
                        <span className="sm:hidden">Ramji Electrical Shop</span>
                    </Link>
                    
                    {/* Desktop Navigation - Hidden on Mobile */}
                    <div className="hidden md:flex space-x-2 lg:space-x-6">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                        isActive
                                            ? 'bg-gray-900 text-white shadow-md transform scale-105'
                                            : 'text-blue-100 hover:bg-gray-500 hover:text-white hover:scale-105'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                                    <span className="hidden lg:inline">{item.label}</span>
                                    <span className="lg:hidden text-xs">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Mobile Menu Button - Only Visible on Mobile */}
                    <button
                        onClick={toggleMobileMenu}
                        className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-blue-100 hover:text-white hover:bg-gray-500 transition-colors duration-200"
                        aria-label="Toggle mobile menu"
                    >
                        {isMobileMenuOpen ? (
                            <XMarkIcon className="h-6 w-6" />
                        ) : (
                            <Bars3Icon className="h-6 w-6" />
                        )}
                    </button>
                </div>

                {/* Mobile Navigation Menu - Collapsible (NO BLACK OVERLAY) */}
                <div className={`md:hidden transition-all duration-300 ease-in-out ${
                    isMobileMenuOpen 
                        ? 'max-h-screen opacity-100 pb-4' 
                        : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                    <div className="border-t border-white pt-3">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={closeMobileMenu}
                                        className={`flex flex-col items-center justify-center p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                            isActive
                                                ? 'bg-gray-900 text-white shadow-md'
                                                : 'text-blue-100 hover:bg-gray-500 hover:text-white'
                                        }`}
                                    >
                                        <Icon className="w-6 h-6 mb-1" />
                                        <span className="text-xs">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* REMOVED THE BLACK OVERLAY - This was causing the issue */}
        </nav>
    );
};

export default Navbar;
