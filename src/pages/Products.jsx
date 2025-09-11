import React, { useState, useEffect, useRef } from 'react';
import { productsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../stores/useCartStore';
import Alert from '../components/Alert';

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

    // Alert state
    const [alert, setAlert] = useState({
        isOpen: false,
        severity: 'info',
        message: ''
    });

    // Alert helper functions
    const showAlert = (severity, message) => {
        setAlert({
            isOpen: true,
            severity,
            message
        });
    };

    const closeAlert = () => {
        setAlert(prev => ({ ...prev, isOpen: false }));
    };

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
                showAlert('info', 'Loading products...');
                
                const response = await productsAPI.getAll();
                const fetchedProducts = response.data || [];

                const productsWithNumbers = fetchedProducts.map(product => ({
                    ...product,
                    id: String(product.id), // Ensure ID is string for consistency
                    price: parseFloat(product.price) || 0,
                    image_url: product.image_url && !product.image_url.startsWith('http')
                        ? `http://localhost:8000${product.image_url}`
                        : product.image_url
                }));

                console.log('Fetched products:', productsWithNumbers.length);
                setProducts(productsWithNumbers);
                setProductsInStore(productsWithNumbers);
                
                if (productsWithNumbers.length === 0) {
                    showAlert('info', 'No products available in the catalog');
                } else {
                    showAlert('success', `Successfully loaded ${productsWithNumbers.length} products`);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
                setError(`Failed to load products: ${errorMessage}`);
                showAlert('error', `Failed to load products: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [setProductsInStore]);

    const handleCheckout = () => {
        if (totalCartItems === 0) {
            showAlert('warning', 'Your cart is empty. Add some products first!');
            return;
        }
        
        showAlert('info', 'Proceeding to checkout...');
        setTimeout(() => {
            navigate('/checkout', {
                state: {
                    cart,
                    cartItems,
                    products
                }
            });
        }, 1000);
    };

    const handleClearCart = () => {
        if (totalCartItems === 0) {
            showAlert('info', 'Cart is already empty');
            return;
        }
        
        clearCart();
        showAlert('success', `Cleared ${totalCartItems} items from cart`);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        showAlert('info', 'Search cleared - showing all products');
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        if (category) {
            const categoryProducts = products.filter(p => p.category === category);
            showAlert('info', `Filtered by ${toTitleCase(category)} - ${categoryProducts.length} products found`);
        } else {
            showAlert('info', `Showing all categories - ${products.length} products`);
        }
    };

    const handleSearchChange = (term) => {
        setSearchTerm(term);
        if (term.length > 2) {
            const searchResults = products.filter(product => 
                product.name?.toLowerCase().includes(term.toLowerCase()) ||
                product.category?.toLowerCase().includes(term.toLowerCase()) ||
                (product.brand && product.brand.toLowerCase().includes(term.toLowerCase()))
            );
            showAlert('info', `Found ${searchResults.length} products matching "${term}"`);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-gray-600">Loading products...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-6">
                <Alert
                    isOpen={alert.isOpen}
                    severity={alert.severity}
                    message={alert.message}
                    onClose={closeAlert}
                    position="top"
                    duration={4000}
                />
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <h3 className="font-bold">Error</h3>
                    <p>{error}</p>
                    <button
                        onClick={() => {
                            showAlert('info', 'Retrying to load products...');
                            window.location.reload();
                        }}
                        className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Alert Component */}
            <Alert
                isOpen={alert.isOpen}
                severity={alert.severity}
                message={alert.message}
                onClose={closeAlert}
                position="top"
                duration={4000}
            />

            {/* Fixed Header Section */}
            <div className="flex-shrink-0 px-8 py-3 bg-white border-b border-gray-200">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Products Catalog</h1>
                        <p className="text-gray-600 mt-1">
                            {filteredProducts.length !== products.length ? (
                                <>
                                    Showing {filteredProducts.length} of {products.length} products
                                    {selectedCategory && ` in ${toTitleCase(selectedCategory)}`}
                                    {searchTerm && ` matching "${searchTerm}"`}
                                </>
                            ) : (
                                `${products.length} products available`
                            )}
                        </p>
                    </div>

                    {/* Cart Summary */}
                    {totalCartItems > 0 && (
                        <div className="bg-blue-100 text-blue-800 px-6 py-3 rounded-lg flex items-center space-x-4">
                            <div>
                                <span className="font-semibold">{totalCartItems} items</span>
                                <span className="mx-2">•</span>
                                <span className="font-bold">₹{totalCartValue.toFixed(2)}</span>
                            </div>
                            <button
                                onClick={handleClearCart}
                                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                                title="Clear all items from cart"
                            >
                                Clear Cart
                            </button>
                        </div>
                    )}
                </div>

                {/* Enhanced Filters */}
                <div className="mb-3 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search products by name, brand, or category..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchTerm && (
                            <button
                                onClick={handleClearSearch}
                                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                                title="Clear search"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    
                    <select
                        value={selectedCategory}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-48"
                    >
                        <option value="">All Categories ({products.length})</option>
                        {categories.map(category => (
                            <option key={category} value={category}>
                                {toTitleCase(category)} ({products.filter(p => p.category === category).length})
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={() => {
                            showAlert('info', 'Refreshing products...');
                            window.location.reload();
                        }}
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                        title="Refresh products"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Scrollable Products Section */}
            <div className="flex-1 overflow-y-auto px-8 py-4">
                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                        />
                    ))}
                </div>

                {/* No Products Found */}
                {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-gray-500 text-lg mb-4">
                            {products.length === 0
                                ? 'No products available in the catalog'
                                : searchTerm || selectedCategory
                                ? 'No products found matching your criteria'
                                : 'No products to display'
                            }
                        </p>
                        
                        {searchTerm && (
                            <div className="space-y-2">
                                <p className="text-gray-400 text-sm">
                                    Try searching for "{searchTerm}" in a different way
                                </p>
                                <button
                                    onClick={handleClearSearch}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Clear Search
                                </button>
                            </div>
                        )}

                        {selectedCategory && !searchTerm && (
                            <div className="space-y-2">
                                <p className="text-gray-400 text-sm">
                                    No products available in {toTitleCase(selectedCategory)} category
                                </p>
                                <button
                                    onClick={() => handleCategoryChange('')}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Show All Categories
                                </button>
                            </div>
                        )}

                        {!searchTerm && !selectedCategory && products.length === 0 && (
                            <div className="space-y-2">
                                <p className="text-gray-400 text-sm">
                                    Contact administrator to add products to the catalog
                                </p>
                                <button
                                    onClick={() => {
                                        showAlert('info', 'Refreshing to check for new products...');
                                        window.location.reload();
                                    }}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Check for New Products
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Fixed Checkout Button */}
            {totalCartItems > 0 && (
                <div className="fixed bottom-6 right-6 z-50">
                    <button
                        onClick={handleCheckout}
                        className="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-700 transition-all duration-200 flex items-center space-x-2 hover:scale-105"
                        title={`Checkout ${totalCartItems} items worth ₹${totalCartValue.toFixed(2)}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 18m-8 0h8m-8 0V9a3 3 0 016 0v9" />
                        </svg>
                        <span>Checkout</span>
                        <span className="bg-white text-green-600 px-2 py-1 rounded-full text-sm font-bold">
                            {totalCartItems}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default Products;
