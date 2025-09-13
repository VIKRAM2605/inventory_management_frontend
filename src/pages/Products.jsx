import React, { useState, useEffect, useRef } from 'react';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../stores/useCartStore';
import ErrorPortal from '../components/ErrorPortal';

// toTitleCase function
function toTitleCase(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const hasFetched = useRef(false);

    // Zustand store hooks
    const cart = useCartStore((state) => state.cart);
    const setCart = useCartStore((state) => state.setCart);
    const setProductsInStore = useCartStore((state) => state.setProducts);
    const clearCart = useCartStore((state) => state.clearCart);
    const getTotalItems = useCartStore((state) => state.getTotalItems);
    const getTotalValue = useCartStore((state) => state.getTotalValue);
    const getCartItems = useCartStore((state) => state.getCartItems);

    // Get totals
    const totalCartItems = getTotalItems();
    const totalCartValue = getTotalValue();
    const cartItems = getCartItems();

    console.log('Products render:', {
        totalCartItems,
        totalCartValue,
        cart
    });

    // Fetch products only once
    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await productsAPI.getAll();
                const fetchedProducts = response.data || [];

                const productsWithNumbers = fetchedProducts.map(product => ({
                    ...product,
                    id: String(product.id),
                    price: parseFloat(product.price) || 0,
                    image_url: product.image_url && !product.image_url.startsWith('http')
                        ? `https://inventory-management-backend-qqqj.onrender.com/${product.image_url}`
                        : product.image_url
                }));

                console.log('Fetched products:', productsWithNumbers.length);
                setProducts(productsWithNumbers);
                setProductsInStore(productsWithNumbers);
            } catch (error) {
                console.error('Error fetching products:', error);
                const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
                setError(`Failed to load products: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [setProductsInStore]);

    const handleCheckout = () => {
        if (totalCartItems === 0) {
            return;
        }

        navigate('/checkout', {
            state: {
                cart,
                cartItems,
                products
            }
        });
    };

    const handleClearCart = () => {
        if (totalCartItems === 0) {
            return;
        }
        clearCart();
    };

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        if (category) {
            const categoryProducts = products.filter(p => p.category === category);
        }
    };

    const handleSearchChange = (term) => {
        setSearchTerm(term);
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

    const getOptionText = (category, count) => {
        return window.innerWidth < 640
            ? `${toTitleCase(category)} (${count})`
            : `${toTitleCase(category)} (${count})`;
    };

    const getAllCategoriesText = () => {
        return window.innerWidth < 640
            ? `All (${products.length})`
            : `All Categories (${products.length})`;
    };

    if (loading) {
        return (
            <div className="app-container flex justify-center items-center bg-gray-50 p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* ERROR PORTAL - RENDERS OUTSIDE COMPONENT TREE */}
            <ErrorPortal isVisible={!!error}>
                <div 
                    className="bg-white border border-red-400 text-red-700 px-6 py-6 rounded-xl shadow-2xl max-w-md w-full mx-4"
                    style={{
                        maxWidth: '500px',
                        width: '100%',
                        animation: 'slideIn 0.3s ease-out'
                    }}
                >
                    <div className="flex items-center mb-4">
                        <svg className="w-8 h-8 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="font-bold text-xl text-red-800">Connection Error</h3>
                    </div>
                    <p className="mb-6 text-red-600 text-sm leading-relaxed">{error}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setError(null);
                                hasFetched.current = false;
                                window.location.reload();
                            }}
                            className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                        >
                            🔄 Retry Connection
                        </button>
                        <button
                            onClick={() => {
                                setError(null);
                                navigate('/');
                            }}
                            className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                        >
                            🏠 Go Home
                        </button>
                    </div>
                </div>
            </ErrorPortal>

            <div className="app-container">
                {/* Desktop Layout */}
                <div className="hidden lg:flex lg:flex-col lg:bg-gray-50 lg:h-screen">
                    {/* Desktop Header */}
                    <div className="bg-white border-b border-gray-200 flex-shrink-0">
                        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                            <div className="flex flex-col space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                                    <div className="flex-1">
                                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                                            Products
                                        </h1>
                                        <p className="text-sm sm:text-base text-gray-600 mt-1">
                                            {filteredProducts.length !== products.length ? (
                                                <>
                                                    <span className="font-semibold">{filteredProducts.length}</span>
                                                    <span className="hidden sm:inline"> of {products.length} products</span>
                                                    <span className="sm:hidden">/{products.length}</span>
                                                    {selectedCategory && (
                                                        <>
                                                            <span className="hidden sm:inline"> in </span>
                                                            <span className="sm:hidden"> • </span>
                                                            {toTitleCase(selectedCategory)}
                                                        </>
                                                    )}
                                                    {searchTerm && (
                                                        <>
                                                            <span className="hidden sm:inline"> matching "</span>
                                                            <span className="sm:hidden"> • "</span>
                                                            {searchTerm}"
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <span>{products.length} products available</span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Cart Summary & Checkout Button */}
                                    {totalCartItems > 0 && (
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 sm:px-5 sm:py-3 rounded-lg flex items-center justify-between sm:justify-start space-x-3 flex-1 sm:flex-none">
                                                <div className="text-sm sm:text-base">
                                                    <span className="font-semibold">{totalCartItems}</span>
                                                    <span className="mx-2">items •</span>
                                                    <span className="font-bold">₹{totalCartValue.toFixed(0)}</span>
                                                </div>
                                                <button
                                                    onClick={handleClearCart}
                                                    className="bg-red-500 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm hover:bg-red-600 transition-colors flex-shrink-0"
                                                    title="Clear cart"
                                                >
                                                    <span className="hidden sm:inline">Clear</span>
                                                    <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleCheckout}
                                                className="bg-green-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-md hover:bg-green-700 transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105 text-sm sm:text-base font-medium"
                                            >
                                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 18m-8 0h8m-8 0V9a3 3 0 616 0v9" />
                                                </svg>
                                                <span className="hidden sm:inline">Checkout</span>
                                                <span className="sm:hidden">Go</span>
                                                <span className="bg-white text-green-600 px-2 py-1 rounded-full text-xs font-bold min-w-6 text-center">
                                                    {totalCartItems}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Search & Filters */}
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Search products by name, brand, or category..."
                                            value={searchTerm}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            className="w-full px-4 py-2.5 sm:py-3 pl-11 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                        />
                                        <svg className="absolute left-3.5 top-3 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        {searchTerm && (
                                            <button
                                                onClick={handleClearSearch}
                                                className="absolute right-3 top-3 sm:top-3.5 text-gray-400 hover:text-gray-600"
                                            >
                                                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => handleCategoryChange(e.target.value)}
                                            className="flex-1 sm:flex-none px-3 py-2.5 sm:py-3 sm:px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base sm:min-w-48"
                                        >
                                            <option value="">{getAllCategoriesText()}</option>
                                            {categories.map(category => (
                                                <option key={category} value={category}>
                                                    {getOptionText(category, products.filter(p => p.category === category).length)}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center flex-shrink-0"
                                        >
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            <span className="hidden sm:inline">Refresh</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Products Grid */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                            <div className="grid gap-6 w-full" style={{
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                justifyItems: 'stretch',
                                alignItems: 'start'
                            }}>
                                {filteredProducts.map(product => (
                                    <div key={product.id} className="w-full">
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                            
                            {filteredProducts.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📦</div>
                                    <p className="text-gray-500 text-lg mb-4">No products found</p>
                                    {searchTerm && (
                                        <button
                                            onClick={handleClearSearch}
                                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Clear Search
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Layout */}
                <div className="block lg:hidden">
                    {/* Mobile Header */}
                    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
                        <div className="px-4 py-4">
                            <div className="flex flex-col space-y-4">
                                <div className="flex flex-col space-y-3">
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {filteredProducts.length !== products.length ? (
                                                <>
                                                    <span className="font-semibold">{filteredProducts.length}</span>
                                                    <span>/{products.length}</span>
                                                    {selectedCategory && <span> • {toTitleCase(selectedCategory)}</span>}
                                                    {searchTerm && <span> • "{searchTerm}"</span>}
                                                </>
                                            ) : (
                                                <span>{products.length} products available</span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Mobile Cart */}
                                    {totalCartItems > 0 && (
                                        <div className="flex flex-col space-y-2 w-full">
                                            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg flex items-center justify-between">
                                                <div className="text-sm">
                                                    <span className="font-semibold">{totalCartItems}</span>
                                                    <span className="mx-2">items •</span>
                                                    <span className="font-bold">₹{totalCartValue.toFixed(0)}</span>
                                                </div>
                                                <button
                                                    onClick={handleClearCart}
                                                    className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleCheckout}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm font-medium w-full"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 18m-8 0h8m-8 0V9a3 3 0 616 0v9" />
                                                </svg>
                                                <span>Checkout</span>
                                                <span className="bg-white text-green-600 px-2 py-1 rounded-full text-xs font-bold">
                                                    {totalCartItems}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Mobile Search & Filters */}
                                <div className="flex flex-col space-y-3">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search products..."
                                            value={searchTerm}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            className="w-full px-4 py-3 pl-11 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        />
                                        <svg className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        {searchTerm && (
                                            <button
                                                onClick={handleClearSearch}
                                                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => handleCategoryChange(e.target.value)}
                                            className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        >
                                            <option value="">{getAllCategoriesText()}</option>
                                            {categories.map(category => (
                                                <option key={category} value={category}>
                                                    {getOptionText(category, products.filter(p => p.category === category).length)}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="px-3 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center flex-shrink-0"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Products Grid */}
                    <div className="bg-gray-50 px-4 py-6">
                        <div className="flex flex-wrap justify-center gap-4 max-w-6xl mx-auto">
                            {filteredProducts.map(product => (
                                <div 
                                    key={product.id} 
                                    className="w-full max-w-sm"
                                    style={{ maxWidth: '340px', minWidth: '280px' }}
                                >
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                        
                        {filteredProducts.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">📦</div>
                                <p className="text-gray-500 mb-4">No products found</p>
                                {searchTerm && (
                                    <button
                                        onClick={handleClearSearch}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                    >
                                        Clear Search
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Products;
