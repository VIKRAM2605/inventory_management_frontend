import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';
import Alert from './Alert';

const InventoryForm = ({ product, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        brand: '',
        price: '',
        stock_quantity: '',
        sku: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    
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

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                category: product.category || '',
                brand: product.brand || '',
                price: product.price || '',
                stock_quantity: product.stock_quantity || '',
                sku: product.sku || ''
            });
            setImagePreview(product.image_url);
            showAlert('info', 'Product loaded for editing');
        } else {
            showAlert('info', 'Ready to add new product');
        }
    }, [product]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showAlert('error', 'Image size must be less than 5MB');
                return;
            }
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                showAlert('error', 'Please select a valid image file (JPEG, PNG, GIF, or WebP)');
                return;
            }

            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            showAlert('success', 'Image selected successfully');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.name.trim()) {
            showAlert('error', 'Product name is required');
            return;
        }
        
        if (!formData.sku.trim()) {
            showAlert('error', 'SKU is required');
            return;
        }
        
        if (!formData.category.trim()) {
            showAlert('error', 'Category is required');
            return;
        }
        
        if (!formData.price || parseFloat(formData.price) <= 0) {
            showAlert('error', 'Please enter a valid price');
            return;
        }
        
        if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
            showAlert('error', 'Please enter a valid stock quantity');
            return;
        }

        setLoading(true);
        showAlert('info', product ? 'Updating product...' : 'Adding product...');

        try {
            const submitData = new FormData();

            // Append all form data
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });

            // Append image if selected
            if (imageFile) {
                submitData.append('image', imageFile);
            }

            if (product) {
                await inventoryAPI.update(product.id, submitData);
                showAlert('success', `Product "${formData.name}" updated successfully!`);
            } else {
                await inventoryAPI.add(submitData);
                showAlert('success', `Product "${formData.name}" added successfully!`);
            }

            // Close form after showing success message
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Error saving product:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
            showAlert('error', `Failed to save product: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        showAlert('info', 'Closing form...');
        setTimeout(onClose, 1000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 xs:p-4">
            {/* Alert Component */}
            <Alert
                isOpen={alert.isOpen}
                severity={alert.severity}
                message={alert.message}
                onClose={closeAlert}
                position="top"
                duration={4000}
            />
            
            {/* RESPONSIVE MODAL CONTAINER */}
            <div className="bg-white rounded-lg w-full max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl max-h-[95vh] xs:max-h-[90vh] overflow-hidden flex flex-col">
                
                {/* STICKY HEADER */}
                <div className="flex-shrink-0 flex justify-between items-center p-3 xs:p-4 sm:p-6 border-b border-gray-200 bg-white">
                    <h2 className="text-base xs:text-lg sm:text-xl font-semibold text-gray-900 truncate pr-4">
                        {product ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 text-xl xs:text-2xl flex-shrink-0 p-1"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {/* SCROLLABLE FORM CONTENT */}
                <div className="flex-1 overflow-y-auto p-3 xs:p-4 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-3 xs:space-y-4 sm:space-y-6">
                        
                        {/* IMAGE UPLOAD SECTION */}
                        <div className="bg-gray-50 p-3 xs:p-4 rounded-lg">
                            <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-2 xs:mb-3">
                                Product Image
                            </label>
                            
                            <div className="flex flex-col xs:flex-row items-start xs:items-center space-y-3 xs:space-y-0 xs:space-x-4">
                                {/* IMAGE PREVIEW */}
                                <div className="flex-shrink-0 w-full xs:w-auto">
                                    {imagePreview ? (
                                        <div className="relative inline-block">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="h-16 w-16 xs:h-20 xs:w-20 sm:h-24 sm:w-24 object-cover rounded-lg border-2 border-gray-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImagePreview(null);
                                                    setImageFile(null);
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-16 w-16 xs:h-20 xs:w-20 sm:h-24 sm:w-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                            <svg className="w-6 h-6 xs:w-8 xs:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                
                                {/* FILE INPUT */}
                                <div className="flex-1 w-full">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="block w-full text-xs xs:text-sm text-gray-500 
                                                 file:mr-2 xs:file:mr-4 file:py-1.5 xs:file:py-2 file:px-2 xs:file:px-4 
                                                 file:rounded-lg file:border-0 file:text-xs xs:file:text-sm file:font-semibold 
                                                 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 
                                                 cursor-pointer file:cursor-pointer transition-colors"
                                    />
                                    <p className="text-xs text-gray-500 mt-1 leading-tight">
                                        JPEG, PNG, GIF, WebP • Max: 5MB
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* FORM FIELDS */}
                        <div className="space-y-3 xs:space-y-4">
                            
                            {/* NAME & SKU ROW */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                                <div>
                                    <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                                        Product Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Enter product name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 rounded-lg 
                                                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                                        SKU <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="sku"
                                        placeholder="Enter SKU code"
                                        value={formData.sku}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 rounded-lg 
                                                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* DESCRIPTION */}
                            <div>
                                <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    placeholder="Enter product description (optional)"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 rounded-lg 
                                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
                                />
                            </div>

                            {/* CATEGORY & BRAND ROW */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                                <div>
                                    <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="category"
                                        placeholder="e.g., Electronics"
                                        value={formData.category}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 rounded-lg 
                                                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                                        Brand
                                    </label>
                                    <input
                                        type="text"
                                        name="brand"
                                        placeholder="e.g., Samsung"
                                        value={formData.brand}
                                        onChange={handleChange}
                                        className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 rounded-lg 
                                                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* PRICE & STOCK ROW */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                                <div>
                                    <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                                        Price (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        step="0.01"
                                        className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 rounded-lg 
                                                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                                        Stock Quantity <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="stock_quantity"
                                        placeholder="0"
                                        value={formData.stock_quantity}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 rounded-lg 
                                                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* STICKY FOOTER WITH ACTION BUTTONS */}
                <div className="flex-shrink-0 p-3 xs:p-4 sm:p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-3">
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-2 xs:py-3 px-4 rounded-lg hover:bg-blue-700 
                                     disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors 
                                     flex items-center justify-center font-medium text-sm xs:text-base"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 xs:mr-3 h-4 w-4 xs:h-5 xs:w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 xs:w-5 xs:h-5 mr-1 xs:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>{product ? 'Update Product' : 'Add Product'}</span>
                                </>
                            )}
                        </button>
                        
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 xs:py-3 px-4 rounded-lg hover:bg-gray-400 
                                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors 
                                     flex items-center justify-center font-medium text-sm xs:text-base"
                        >
                            <svg className="w-4 h-4 xs:w-5 xs:h-5 mr-1 xs:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>Cancel</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryForm;
