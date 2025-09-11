import React, { useState, useEffect, useCallback } from 'react';
import { productsAPI, inventoryAPI } from '../services/api';
import InventoryForm from '../components/InventoryForm';
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

const Inventory = () => {
    const [products, setProducts] = useState([]);
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

    // Memoize fetchProducts function
    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            showAlert('info', 'Loading inventory...');
            
            const response = await productsAPI.getAll();
            setProducts(response.data);
            
            if (response.data.length === 0) {
                showAlert('info', 'No products found. Add your first product to get started!');
            } else {
                showAlert('success', `Successfully loaded ${response.data.length} products`);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
            setError(`Failed to load products: ${errorMessage}`);
            showAlert('error', `Failed to load inventory: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Run only on component mount
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleAddProduct = useCallback(() => {
        setEditingProduct(null);
        setShowForm(true);
        showAlert('info', 'Opening form to add new product');
    }, []);

    const handleEditProduct = useCallback((product) => {
        setEditingProduct(product);
        setShowForm(true);
        showAlert('info', `Editing product: ${toTitleCase(product.name)}`);
    }, []);

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
    }, [fetchProducts]);

    const handleFormClose = useCallback(() => {
        setShowForm(false);
        setEditingProduct(null);
        showAlert('info', 'Form closed. Refreshing inventory...');
        fetchProducts(); // Refresh the list after form closes
    }, [fetchProducts]);

    const handleRetry = () => {
        showAlert('info', 'Retrying to load inventory...');
        fetchProducts();
    };

    const getStockStatus = (stockQuantity) => {
        if (stockQuantity > 10) return { class: 'bg-green-100 text-green-800', text: 'In Stock' };
        if (stockQuantity > 0) return { class: 'bg-yellow-100 text-yellow-800', text: 'Low Stock' };
        return { class: 'bg-red-100 text-red-800', text: 'Out of Stock' };
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-gray-600">Loading inventory...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-8xl mx-auto px-8 py-6">
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
                        onClick={handleRetry}
                        className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
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
            <div className="flex-shrink-0 px-8 py-6 bg-white border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
                        <p className="text-gray-600 mt-1">
                            Manage your products • Total: <span className="font-semibold">{products.length}</span> items
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => {
                                showAlert('info', 'Refreshing inventory...');
                                fetchProducts();
                            }}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                        <button
                            onClick={handleAddProduct}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add New Product
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-blue-800 text-sm font-medium">Total Products</div>
                        <div className="text-blue-900 text-2xl font-bold">{products.length}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-green-800 text-sm font-medium">In Stock</div>
                        <div className="text-green-900 text-2xl font-bold">
                            {products.filter(p => p.stock_quantity > 10).length}
                        </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-yellow-800 text-sm font-medium">Low Stock</div>
                        <div className="text-yellow-900 text-2xl font-bold">
                            {products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 10).length}
                        </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-red-800 text-sm font-medium">Out of Stock</div>
                        <div className="text-red-900 text-2xl font-bold">
                            {products.filter(p => p.stock_quantity === 0).length}
                        </div>
                    </div>
                </div>
            </div>

            {/* FIXED: Scrollable Content Section with proper padding */}
            <div className="flex-1 px-8 py-4 overflow-hidden">
                <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
                    
                    {/* Table Header - Fixed */}
                    <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category & Brand
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stock Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            SKU
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                            </table>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto pb-20" style={{ minHeight: 0 }}>
                        {products.length > 0 ? (
                            <table className="min-w-full">
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {products.map((product) => {
                                        const stockStatus = getStockStatus(product.stock_quantity);
                                        return (
                                            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-12 w-12">
                                                            <img
                                                                className="h-12 w-12 rounded-lg object-cover border"
                                                                src={product.image_url || '/api/placeholder/48/48'}
                                                                alt={product.name}
                                                            />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {toTitleCase(product.name)}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {product.description ? 
                                                                    (product.description.length > 50 ? 
                                                                        `${product.description.substring(0, 50)}...` : 
                                                                        product.description
                                                                    ) : 'No description'
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{toTitleCase(product.category)}</div>
                                                    <div className="text-sm text-gray-500">{toTitleCase(product.brand) || 'No Brand'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-green-600">
                                                        ₹{parseFloat(product.price).toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.class}`}>
                                                        {product.stock_quantity} • {stockStatus.text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                                        {product.sku?.toUpperCase()}
                                                    </code>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                    <button
                                                        onClick={() => handleEditProduct(product)}
                                                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors inline-flex items-center"
                                                    >
                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product.id, product.name)}
                                                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors inline-flex items-center"
                                                    >
                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            // Empty State
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📋</div>
                                    <p className="text-gray-500 text-lg mb-4">No Products Found</p>
                                    <p className="text-gray-400 text-sm mb-6">Start building your inventory by adding your first product</p>
                                    <button
                                        onClick={handleAddProduct}
                                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center mx-auto"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add Your First Product
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
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
