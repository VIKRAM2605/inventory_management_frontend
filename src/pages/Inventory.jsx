import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { productsAPI, inventoryAPI, billsAPI } from '../services/api';
import InventoryForm from '../components/InventoryForm';
import Alert from '../components/Alert';

// toTitleCase function - moved outside component to prevent recreation
const toTitleCase = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// ProductImage component with enlargement functionality
const ProductImage = React.memo(({ product, size = 'medium' }) => {
    const [imageSrc, setImageSrc] = useState(product.image_url || '/api/placeholder/48/48');
    const [imageError, setImageError] = useState(false);
    const [showEnlarged, setShowEnlarged] = useState(false);

    const handleImageError = useCallback(() => {
        if (!imageError) {
            setImageError(true);
            setImageSrc('/api/placeholder/48/48');
        }
    }, [imageError]);

    const handleImageClick = useCallback(() => {
        // Only show enlarged version if it's not a placeholder image
        if (!imageSrc.includes('placeholder')) {
            setShowEnlarged(true);
        }
    }, [imageSrc]);

    const handleCloseEnlarged = useCallback(() => {
        setShowEnlarged(false);
    }, []);

    const sizeClasses = {
        small: 'h-6 w-6 xs:h-8 xs:w-8 sm:h-10 sm:w-10',
        medium: 'h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12',
        large: 'h-10 w-10 xs:h-12 xs:w-12 sm:h-14 sm:w-14'
    };

    return (
        <>
            <img
                className={`${sizeClasses[size]} rounded-lg object-cover border border-gray-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity duration-200`}
                src={imageSrc}
                alt={product.name}
                onError={handleImageError}
                onClick={handleImageClick}
                loading="lazy"
            />

            {/* Enlarged Image Modal */}
            {showEnlarged && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={handleCloseEnlarged}
                >
                    <div className="relative max-w-4xl max-h-full">
                        {/* Close button */}
                        <button
                            onClick={handleCloseEnlarged}
                            className="absolute top-2 right-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-all duration-200 z-10"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Enlarged image */}
                        <img
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            src={imageSrc}
                            alt={product.name}
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Product name caption */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
                            <p className="text-center font-medium">{toTitleCase(product.name)}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});

ProductImage.displayName = 'ProductImage';

// Stock status calculation - memoized
const getStockStatus = (stockQuantity) => {
    if (stockQuantity > 10) return { class: 'bg-green-100 text-green-800', text: 'In Stock' };
    if (stockQuantity > 0) return { class: 'bg-yellow-100 text-yellow-800', text: 'Low Stock' };
    return { class: 'bg-red-100 text-red-800', text: 'Out of Stock' };
};

// Mobile Product Card Component
const ProductCard = React.memo(({ product, onEdit, onDelete }) => {
    const stockStatus = useMemo(() => getStockStatus(product.stock_quantity), [product.stock_quantity]);
    const handleEdit = useCallback(() => onEdit(product), [onEdit, product]);
    const handleDelete = useCallback(() => onDelete(product.id, product.name), [onDelete, product.id, product.name]);

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-3 xs:p-4 shadow-sm hover:shadow-md transition-all flex-shrink-0">
            {/* Card Header */}
            <div className="flex items-start space-x-3 mb-3">
                <ProductImage product={product} size="medium" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm xs:text-base line-clamp-2 leading-tight">
                        {toTitleCase(product.name)}
                    </h3>
                    <p className="text-xs xs:text-sm text-gray-500 mt-0.5 line-clamp-1">
                        {toTitleCase(product.category)} • {toTitleCase(product.brand) || 'No Brand'}
                    </p>
                    <p className="text-base xs:text-lg font-bold text-green-600 mt-1 break-words">
                        ₹{parseFloat(product.price).toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            {/* Card Body */}
            <div className="space-y-2 mb-3">
                <div className="flex items-start justify-between">
                    <span className="text-xs text-gray-600 flex-shrink-0 pt-0.5">Stock:</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${stockStatus.class} ml-2 text-center`}>
                        {product.stock_quantity} • {stockStatus.text}
                    </span>
                </div>

                <div className="flex items-start justify-between">
                    <span className="text-xs text-gray-600 flex-shrink-0 pt-0.5">SKU:</span>
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-800 ml-2 break-all">
                        {product.sku?.toUpperCase() || 'N/A'}
                    </code>
                </div>

                {product.description && (
                    <div className="border-t pt-2">
                        <span className="text-xs text-gray-600 block mb-1">Description:</span>
                        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                            {product.description}
                        </p>
                    </div>
                )}
            </div>

            {/* Card Actions */}
            <div className="flex space-x-2">
                <button
                    onClick={handleEdit}
                    className="flex-1 bg-blue-600 text-white py-1.5 xs:py-2 px-2 xs:px-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center text-xs"
                >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                </button>
                <button
                    onClick={handleDelete}
                    className="flex-1 bg-red-600 text-white py-1.5 xs:py-2 px-2 xs:px-3 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center justify-center text-xs"
                >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    );
});

ProductCard.displayName = 'ProductCard';

// Desktop Product Row Component - FIXED COLUMN WIDTHS for alignment
const ProductRow = React.memo(({ product, onEdit, onDelete }) => {
    const stockStatus = useMemo(() => getStockStatus(product.stock_quantity), [product.stock_quantity]);
    const handleEdit = useCallback(() => onEdit(product), [onEdit, product]);
    const handleDelete = useCallback(() => onDelete(product.id, product.name), [onDelete, product.id, product.name]);

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            {/* Product Details Column - Fixed Width */}
            <td className="px-4 xl:px-6 py-4 w-1/4">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <ProductImage product={product} size="medium" />
                    </div>
                    <div className="ml-3 xl:ml-4 flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                            {toTitleCase(product.name)}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                            {product.description || 'No description'}
                        </div>
                    </div>
                </div>
            </td>

            {/* Category & Brand Column - Fixed Width */}
            <td className="px-4 xl:px-6 py-4 w-1/6">
                <div className="text-sm text-gray-900 font-medium line-clamp-1">
                    {toTitleCase(product.category)}
                </div>
                <div className="text-sm text-gray-500 line-clamp-1">
                    {toTitleCase(product.brand) || 'No Brand'}
                </div>
            </td>

            {/* Price Column - Fixed Width */}
            <td className="px-4 xl:px-6 py-4 w-1/8">
                <div className="text-sm font-bold text-green-600 break-words">
                    ₹{parseFloat(product.price).toLocaleString('en-IN')}
                </div>
            </td>

            {/* Stock Status Column - Fixed Width */}
            <td className="px-4 xl:px-6 py-4 w-1/6">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.class} whitespace-nowrap`}>
                    {product.stock_quantity} • {stockStatus.text}
                </span>
            </td>

            {/* SKU Column - Fixed Width */}
            <td className="px-4 xl:px-6 py-4 w-1/8">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800 break-all">
                    {product.sku?.toUpperCase() || 'N/A'}
                </code>
            </td>

            {/* Actions Column - Fixed Width */}
            <td className="px-4 xl:px-6 py-4 w-1/6">
                <div className="flex space-x-2">
                    <button
                        onClick={handleEdit}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors inline-flex items-center text-xs"
                    >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                    </button>
                    <button
                        onClick={handleDelete}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors inline-flex items-center text-xs"
                    >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
});

ProductRow.displayName = 'ProductRow';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [salesData, setSalesData] = useState({ totalSales: 0, actualSales: 0 });
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Alert state
    const [alert, setAlert] = useState({
        isOpen: false,
        severity: 'info',
        message: ''
    });

    // Alert helper functions - memoized to prevent recreation
    const showAlert = useCallback((severity, message) => {
        setAlert({
            isOpen: true,
            severity,
            message
        });
    }, []);

    const closeAlert = useCallback(() => {
        setAlert(prev => ({ ...prev, isOpen: false }));
    }, []);

    // Calculate total inventory value - memoized
    const calculateInventoryValue = useCallback((productsList) => {
        return productsList.reduce((total, product) => {
            return total + (parseFloat(product.price || 0) * parseInt(product.stock_quantity || 0));
        }, 0);
    }, []);

    // Fetch sales data from bills API - memoized
    const fetchSalesData = useCallback(async () => {
        try {
            const response = await billsAPI.getAll();
            const bills = response.data || [];

            const totalSales = bills.reduce((sum, bill) => sum + parseFloat(bill.total_amount || 0), 0);
            const actualSales = bills.reduce((sum, bill) => {
                const discountAmount = (parseFloat(bill.total_amount || 0) * parseFloat(bill.discount_percentage || 0)) / 100;
                return sum + (parseFloat(bill.total_amount || 0) - discountAmount);
            }, 0);

            setSalesData({ totalSales, actualSales });
        } catch (error) {
            console.error('Error fetching sales data:', error);
            setSalesData({ totalSales: 0, actualSales: 0 });
        }
    }, []);

    // Fetch products function - optimized
    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [productsResponse] = await Promise.all([
                productsAPI.getAll(),
                fetchSalesData() // Fetch both simultaneously
            ]);

            setProducts(productsResponse.data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
            setError(`Failed to load products: ${errorMessage}`);
            showAlert('error', `Failed to load inventory: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, [showAlert, fetchSalesData]);

    // Run only on component mount
    useEffect(() => {
        fetchProducts();
    }, []);

    // Event handlers - memoized
    const handleAddProduct = useCallback(() => {
        setEditingProduct(null);
        setShowForm(true);
        showAlert('info', 'Opening form to add new product');
    }, [showAlert]);

    const handleEditProduct = useCallback((product) => {
        setEditingProduct(product);
        setShowForm(true);
        showAlert('info', `Editing product: ${toTitleCase(product.name)}`);
    }, [showAlert]);

    const handleDeleteProduct = useCallback(async (productId, productName) => {
        const confirmMessage = `Are you sure you want to delete "${toTitleCase(productName)}"? This action cannot be undone.`;

        if (window.confirm(confirmMessage)) {
            try {
                showAlert('warning', 'Deleting product...');
                await inventoryAPI.delete(productId);
                showAlert('success', `Product "${toTitleCase(productName)}" deleted successfully`);
                await fetchProducts(); // Refresh the list
            } catch (error) {
                console.error('Error deleting product:', error);
                const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
                showAlert('error', `Failed to delete product: ${errorMessage}`);
            }
        } else {
            showAlert('info', 'Product deletion cancelled');
        }
    }, [fetchProducts, showAlert]);

    const handleFormClose = useCallback(() => {
        setShowForm(false);
        setEditingProduct(null);
        fetchProducts(); // Refresh the list after form closes
    }, [fetchProducts, showAlert]);

    const handleRetry = useCallback(() => {
        fetchProducts();
    }, [fetchProducts, showAlert]);

    const handleRefresh = useCallback(() => {
        fetchProducts();
    }, [fetchProducts, showAlert]);

    // FIXED: Calculate statistics with TOTAL STOCK calculation - memoized to prevent recalculation
    const statistics = useMemo(() => {
        const totalInventoryValue = calculateInventoryValue(products);
        const inStockCount = products.filter(p => (p.stock_quantity || 0) > 10).length;
        const lowStockCount = products.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 10).length;
        const outOfStockCount = products.filter(p => (p.stock_quantity || 0) === 0).length;

        // NEW: Calculate total stock quantity across all products
        const totalStockQuantity = products.reduce((total, product) => {
            return total + parseInt(product.stock_quantity || 0);
        }, 0);

        return {
            totalInventoryValue,
            inStockCount,
            lowStockCount,
            outOfStockCount,
            totalStockQuantity // Added this new calculation
        };
    }, [products, calculateInventoryValue]);

    if (loading) {
        return (
            <div className="app-container flex justify-center items-center bg-gray-50 p-4">
                <div className="animate-spin rounded-full h-8 w-8 xs:h-12 xs:w-12 border-b-2 border-blue-600"></div>
                <p className="ml-3 xs:ml-4 text-gray-600 text-sm xs:text-base">Loading inventory...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-container bg-gray-50 p-2 xs:p-4 sm:p-6 lg:p-8">
                <Alert
                    isOpen={alert.isOpen}
                    severity={alert.severity}
                    message={alert.message}
                    onClose={closeAlert}
                    position="top"
                    duration={4000}
                />
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 xs:px-4 py-3 rounded">
                    <h3 className="font-bold text-sm xs:text-base">Error</h3>
                    <p className="text-sm xs:text-base">{error}</p>
                    <button
                        onClick={handleRetry}
                        className="mt-2 bg-red-600 text-white px-3 xs:px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm xs:text-base"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container"> {/* 🔑 Main scrollable wrapper */}
            {/* Alert Component */}
            <Alert
                isOpen={alert.isOpen}
                severity={alert.severity}
                message={alert.message}
                onClose={closeAlert}
                position="top"
                duration={4000}
            />

            {/* Desktop Layout - Fixed Header with Scrollable Content */}
            <div className="hidden lg:flex lg:flex-col lg:bg-gray-50" style={{ height: '100vh' }}>
                {/* Fixed Header Section - Desktop Only */}
                <div className="bg-white border-b border-gray-200 flex-shrink-0">
                    <div className="px-2 xs:px-4 sm:px-6 lg:px-8 py-3 xs:py-4 sm:py-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 xs:mb-6 space-y-3 sm:space-y-0">
                            <div className="min-w-0 flex-1 pr-4">
                                <h1 className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                                    Inventory Management
                                </h1>
                                <p className="text-xs xs:text-sm text-gray-600 mt-1 break-words">
                                    Manage your products • Total: <span className="font-semibold">{products.length}</span> items • Stock: <span className="font-semibold">{statistics.totalStockQuantity}</span> units
                                </p>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                {/* Refresh Button - Enhanced */}
                                <button
                                    onClick={handleRefresh}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-lg shadow-md hover:shadow-lg hover:border-gray-300 hover:bg-gray-50 active:scale-98 transition-all duration-150 focus:outline-none focus:ring-3 focus:ring-gray-200 min-w-[120px]"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Refresh
                                </button>

                                {/* Add Product Button - Enhanced */}
                                <button
                                    onClick={handleAddProduct}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-white bg-green-600 rounded-lg shadow-md hover:shadow-lg hover:bg-green-700 active:scale-98 transition-all duration-150 focus:outline-none focus:ring-3 focus:ring-green-200 min-w-[140px]"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Product
                                </button>
                            </div>
                        </div>

                        {/* Statistics Cards with Perfect Alignment */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 xs:gap-3 sm:gap-4">
                            {/* Total Stock Card */}
                            <div className="bg-blue-50 p-3 xs:p-4 sm:p-5 rounded-xl min-w-0 min-h-[100px] xs:min-h-[110px] sm:min-h-[120px] flex flex-col justify-between border border-blue-100 hover:shadow-lg transition-shadow duration-200">
                                <div className="text-blue-800 text-xs font-semibold uppercase tracking-wider leading-tight mb-2">
                                    Total Stock
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="text-blue-900 text-xl xs:text-2xl sm:text-3xl font-bold leading-tight mb-1">
                                        {statistics.totalStockQuantity}
                                    </div>
                                    <div className="text-blue-600 text-xs font-medium">
                                        Total stock available
                                    </div>
                                </div>
                            </div>

                            {/* In Stock Card */}
                            <div className="bg-green-50 p-3 xs:p-4 sm:p-5 rounded-xl min-w-0 min-h-[100px] xs:min-h-[110px] sm:min-h-[120px] flex flex-col justify-between border border-green-100 hover:shadow-lg transition-shadow duration-200">
                                <div className="text-green-800 text-xs font-semibold uppercase tracking-wider leading-tight mb-2">
                                    In Stock
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="text-green-900 text-xl xs:text-2xl sm:text-3xl font-bold leading-tight mb-1">
                                        {statistics.inStockCount}
                                    </div>
                                    <div className="text-green-600 text-xs font-medium">
                                        &gt; 10 stock items
                                    </div>
                                </div>
                            </div>

                            {/* Low Stock Card */}
                            <div className="bg-yellow-50 p-3 xs:p-4 sm:p-5 rounded-xl min-w-0 min-h-[100px] xs:min-h-[110px] sm:min-h-[120px] flex flex-col justify-between border border-yellow-100 hover:shadow-lg transition-shadow duration-200">
                                <div className="text-yellow-800 text-xs font-semibold uppercase tracking-wider leading-tight mb-2">
                                    Low Stock
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="text-yellow-900 text-xl xs:text-2xl sm:text-3xl font-bold leading-tight mb-1">
                                        {statistics.lowStockCount}
                                    </div>
                                    <div className="text-yellow-600 text-xs font-medium">
                                        1-10 stock items
                                    </div>
                                </div>
                            </div>

                            {/* Out of Stock Card */}
                            <div className="bg-red-50 p-3 xs:p-4 sm:p-5 rounded-xl min-w-0 min-h-[100px] xs:min-h-[110px] sm:min-h-[120px] flex flex-col justify-between border border-red-100 hover:shadow-lg transition-shadow duration-200">
                                <div className="text-red-800 text-xs font-semibold uppercase tracking-wider leading-tight mb-2">
                                    Out of Stock
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="text-red-900 text-xl xs:text-2xl sm:text-3xl font-bold leading-tight mb-1">
                                        {statistics.outOfStockCount}
                                    </div>
                                    <div className="text-red-600 text-xs font-medium">
                                        0 stock items
                                    </div>
                                </div>
                            </div>

                            {/* Inventory Value Card */}
                            <div className="bg-purple-50 p-3 xs:p-4 sm:p-5 rounded-xl min-w-0 min-h-[100px] xs:min-h-[110px] sm:min-h-[120px] flex flex-col justify-between col-span-2 sm:col-span-1 border border-purple-100 hover:shadow-lg transition-shadow duration-200">
                                <div className="text-purple-800 text-xs font-semibold uppercase tracking-wider leading-tight mb-2">
                                    Inventory Value
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="text-purple-900 text-lg xs:text-xl sm:text-2xl font-bold leading-tight mb-1 break-words">
                                        ₹{statistics.totalInventoryValue.toLocaleString('en-IN')}
                                    </div>
                                    <div className="text-purple-600 text-xs font-medium">
                                        Total inventory value
                                    </div>
                                </div>
                            </div>

                            {/* Total Sales Card */}
                            <div className="bg-indigo-50 p-3 xs:p-4 sm:p-5 rounded-xl min-w-0 min-h-[100px] xs:min-h-[110px] sm:min-h-[120px] flex flex-col justify-between col-span-2 sm:col-span-2 lg:col-span-1 border border-indigo-100 hover:shadow-lg transition-shadow duration-200">
                                <div className="text-indigo-800 text-xs font-semibold uppercase tracking-wider leading-tight mb-2">
                                    Total Sales
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="text-indigo-900 text-lg xs:text-xl sm:text-2xl font-bold leading-tight mb-1 break-words">
                                        ₹{salesData.totalSales.toLocaleString('en-IN')}
                                    </div>
                                    <div className="text-indigo-500 text-xs break-words">
                                        Actual: ₹{salesData.actualSales.toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop: Table Content */}
                {products.length > 0 ? (
                    <div className="px-2 xs:px-4 sm:px-6 lg:px-8 py-3 xs:py-4 sm:py-6 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '50vh' }}>
                            {/* Fixed Table Header */}
                            <div className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                                <table className="min-w-full table-fixed">
                                    <thead>
                                        <tr>
                                            <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                                                Product Details
                                            </th>
                                            <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                                Category & Brand
                                            </th>
                                            <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                                                Price
                                            </th>
                                            <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                                Stock Status
                                            </th>
                                            <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                                                SKU
                                            </th>
                                            <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                </table>
                            </div>

                            {/* Scrollable Table Body */}
                            <div className="overflow-y-auto" style={{ height: 'calc(50vh - 60px)' }}>
                                <table className="min-w-full table-fixed">
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {products.map((product) => (
                                            <ProductRow
                                                key={product.id}
                                                product={product}
                                                onEdit={handleEditProduct}
                                                onDelete={handleDeleteProduct}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Desktop Empty State
                    <div className="flex-1 flex items-center justify-center px-2 xs:px-4 sm:px-6 lg:px-8 py-3 xs:py-4 sm:py-6">
                        <div className="bg-white rounded-lg shadow-md p-6 xs:p-8 sm:p-12 max-w-md mx-auto">
                            <div className="text-center">
                                <div className="text-4xl xs:text-5xl sm:text-6xl mb-3 xs:mb-4">📦</div>
                                <h3 className="text-lg xs:text-xl sm:text-2xl font-medium text-gray-900 mb-2 xs:mb-4">No Products Found</h3>
                                <p className="text-sm xs:text-base text-gray-500 mb-4 xs:mb-6">
                                    Start building your inventory by adding your first product
                                </p>
                                <button
                                    onClick={handleAddProduct}
                                    className="bg-green-600 text-white px-4 xs:px-6 py-2 xs:py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center mx-auto text-sm xs:text-base"
                                >
                                    <svg className="w-4 h-4 xs:w-5 xs:h-5 mr-1.5 xs:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Your First Product
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile/Tablet Layout - FIXED with native features and proper spacing */}
            <div className="block lg:hidden bg-gray-50 mobile-container mobile-bottom-spacing ensure-scroll-end">
                {/* Header Section - Mobile/Tablet */}
                <div className="bg-white border-b border-gray-200">
                    <div className="px-2 xs:px-4 sm:px-6 py-3 xs:py-4 sm:py-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 xs:mb-6 space-y-3 sm:space-y-0">
                            <div className="min-w-0 flex-1 pr-4">
                                <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 break-words">
                                    Inventory Management
                                </h1>
                                <p className="text-xs xs:text-sm text-gray-600 mt-1 break-words">
                                    Manage your products • Total: <span className="font-semibold">{products.length}</span> items • Stock: <span className="font-semibold">{statistics.totalStockQuantity}</span> units
                                </p>
                            </div>
                            <div className="flex items-center space-x-2 w-full sm:w-auto flex-shrink-0">
                                <button
                                    onClick={handleRefresh}
                                    className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-3 xs:px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center text-xs xs:text-sm whitespace-nowrap"
                                >
                                    <svg className="w-3 h-3 xs:w-4 xs:h-4 mr-1 xs:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span className="hidden xs:inline">Refresh</span>
                                    <span className="xs:hidden">↻</span>
                                </button>
                                <button
                                    onClick={handleAddProduct}
                                    className="flex-1 sm:flex-none bg-green-600 text-white px-3 xs:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-xs xs:text-sm whitespace-nowrap"
                                >
                                    <svg className="w-3 h-3 xs:w-4 xs:h-4 mr-1 xs:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span className="hidden xs:inline">Add Product</span>
                                    <span className="xs:hidden">Add</span>
                                </button>
                            </div>
                        </div>

                        {/* Statistics Cards - Mobile/Tablet with Enhanced Info Text */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 xs:gap-4 sm:gap-5">
                            {/* Total Stock Card - Enhanced with detailed info */}
                            <div className="bg-blue-50 p-3 xs:p-4 sm:p-5 rounded-xl min-w-0 min-h-[100px] xs:min-h-[110px] sm:min-h-[120px] flex flex-col justify-between border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="text-blue-800 text-xs font-semibold uppercase tracking-wider leading-tight mb-2">
                                    Total Stock
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="text-blue-900 text-xl xs:text-2xl sm:text-3xl font-bold leading-tight mb-1">
                                        {statistics.totalStockQuantity}
                                    </div>
                                    <div className="text-blue-600 text-xs font-medium mb-1">
                                        Total units available
                                    </div>
                                </div>
                                <div className="text-blue-500 text-xs leading-tight">
                                    All inventory combined
                                </div>
                            </div>

                            {/* In Stock Card - Enhanced with detailed info */}
                            <div className="bg-green-50 p-3 xs:p-4 sm:p-5 rounded-xl min-w-0 min-h-[100px] xs:min-h-[110px] sm:min-h-[120px] flex flex-col justify-between border border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="text-green-800 text-xs font-semibold uppercase tracking-wider leading-tight mb-2">
                                    In Stock
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="text-green-900 text-xl xs:text-2xl sm:text-3xl font-bold leading-tight mb-1">
                                        {statistics.inStockCount}
                                    </div>
                                    <div className="text-green-600 text-xs font-medium mb-1">
                                        Products &gt; 10 units
                                    </div>
                                </div>
                                <div className="text-green-500 text-xs leading-tight">
                                    Well-stocked items
                                </div>
                            </div>

                            {/* Low Stock Card - Enhanced with detailed info */}
                            <div className="bg-yellow-50 p-3 xs:p-4 sm:p-5 rounded-xl min-w-0 min-h-[100px] xs:min-h-[110px] sm:min-h-[120px] flex flex-col justify-between border border-yellow-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="text-yellow-800 text-xs font-semibold uppercase tracking-wider leading-tight mb-2">
                                    Low Stock
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="text-yellow-900 text-xl xs:text-2xl sm:text-3xl font-bold leading-tight mb-1">
                                        {statistics.lowStockCount}
                                    </div>
                                    <div className="text-yellow-600 text-xs font-medium mb-1">
                                        Products 1-10 units
                                    </div>
                                </div>
                                <div className="text-yellow-500 text-xs leading-tight">
                                    Needs attention soon
                                </div>
                            </div>

                            {/* Out of Stock Card - Enhanced with detailed info */}
                            <div className="bg-red-50 p-3 xs:p-4 sm:p-5 rounded-xl min-w-0 min-h-[100px] xs:min-h-[110px] sm:min-h-[120px] flex flex-col justify-between border border-red-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="text-red-800 text-xs font-semibold uppercase tracking-wider leading-tight mb-2">
                                    Out of Stock
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="text-red-900 text-xl xs:text-2xl sm:text-3xl font-bold leading-tight mb-1">
                                        {statistics.outOfStockCount}
                                    </div>
                                    <div className="text-red-600 text-xs font-medium mb-1">
                                        Products at 0 units
                                    </div>
                                </div>
                                <div className="text-red-500 text-xs leading-tight">
                                    Requires immediate restock
                                </div>
                            </div>

                            {/* Inventory Value Card - Enhanced with detailed info */}
                            <div className="bg-purple-50 p-3 xs:p-4 sm:p-5 rounded-xl min-w-0 min-h-[100px] xs:min-h-[110px] sm:min-h-[120px] flex flex-col justify-between col-span-2 sm:col-span-1 border border-purple-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="text-purple-800 text-xs font-semibold uppercase tracking-wider leading-tight mb-2">
                                    Inventory Value
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="text-purple-900 text-lg xs:text-xl sm:text-2xl font-bold leading-tight mb-1 break-words">
                                        ₹{statistics.totalInventoryValue.toLocaleString('en-IN')}
                                    </div>
                                    <div className="text-purple-600 text-xs font-medium mb-1">
                                        Total stock worth
                                    </div>
                                </div>
                                <div className="text-purple-500 text-xs leading-tight">
                                    Current market value
                                </div>
                            </div>

                            {/* Total Sales Card - Enhanced with detailed info */}
                            <div className="bg-indigo-50 p-3 xs:p-4 sm:p-5 rounded-xl min-w-0 min-h-[100px] xs:min-h-[110px] sm:min-h-[120px] flex flex-col justify-between col-span-2 sm:col-span-2 lg:col-span-1 border border-indigo-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="text-indigo-800 text-xs font-semibold uppercase tracking-wider leading-tight mb-2">
                                    Total Sales
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="text-indigo-900 text-lg xs:text-xl sm:text-2xl font-bold leading-tight mb-1 break-words">
                                        ₹{salesData.totalSales.toLocaleString('en-IN')}
                                    </div>
                                    <div className="text-indigo-600 text-xs font-medium mb-1">
                                        Revenue generated
                                    </div>
                                </div>
                                <div className="text-indigo-500 text-xs leading-tight break-words">
                                    Net: ₹{salesData.actualSales.toLocaleString('en-IN')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area - Mobile/Tablet with ENHANCED bottom spacing */}
                {products.length > 0 ? (
                    <div className="px-2 xs:px-4 sm:px-6 py-3 xs:py-4 sm:py-6 mobile-content-spacing">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4 mobile-content-spacing">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onEdit={handleEditProduct}
                                    onDelete={handleDeleteProduct}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    // Mobile Empty State with proper spacing
                    <div className="flex items-center justify-center px-2 xs:px-4 sm:px-6 py-8 mobile-content-spacing">
                        <div className="bg-white rounded-lg shadow-md p-6 xs:p-8 sm:p-12 max-w-md mx-auto">
                            <div className="text-center">
                                <div className="text-4xl xs:text-5xl sm:text-6xl mb-3 xs:mb-4">📦</div>
                                <h3 className="text-lg xs:text-xl sm:text-2xl font-medium text-gray-900 mb-2 xs:mb-4">No Products Found</h3>
                                <p className="text-sm xs:text-base text-gray-500 mb-4 xs:mb-6">
                                    Start building your inventory by adding your first product
                                </p>
                                <button
                                    onClick={handleAddProduct}
                                    className="bg-green-600 text-white px-4 xs:px-6 py-2 xs:py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center mx-auto text-sm xs:text-base"
                                >
                                    <svg className="w-4 h-4 xs:w-5 xs:h-5 mr-1.5 xs:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Your First Product
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* Form Modal */}
            {showForm && (
                <InventoryForm
                    product={editingProduct}
                    onClose={handleFormClose}
                />
            )}
        </div>
    );
};

export default Inventory;
