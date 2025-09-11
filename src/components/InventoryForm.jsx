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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            {/* Alert Component */}
            <Alert
                isOpen={alert.isOpen}
                severity={alert.severity}
                message={alert.message}
                onClose={closeAlert}
                position="top"
                duration={4000}
            />
            
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                        {product ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Image
                        </label>
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="h-20 w-20 object-cover rounded-lg border"
                                    />
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            name="name"
                            placeholder="Product Name *"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />

                        <input
                            type="text"
                            name="sku"
                            placeholder="SKU *"
                            value={formData.sku}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <textarea
                        name="description"
                        placeholder="Description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            name="category"
                            placeholder="Category *"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />

                        <input
                            type="text"
                            name="brand"
                            placeholder="Brand"
                            value={formData.brand}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="number"
                            name="price"
                            placeholder="Price *"
                            value={formData.price}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />

                        <input
                            type="number"
                            name="stock_quantity"
                            placeholder="Stock Quantity *"
                            value={formData.stock_quantity}
                            onChange={handleChange}
                            required
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                        >
                            {loading && (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {loading ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryForm;
