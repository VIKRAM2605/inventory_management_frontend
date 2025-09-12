import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { billsAPI } from '../services/api';
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

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Get from Zustand store instead of cartManager
    const cart = useCartStore((state) => state.cart);
    const getCartItems = useCartStore((state) => state.getCartItems);
    const clearCart = useCartStore((state) => state.clearCart);
    const setCart = useCartStore((state) => state.setCart);

    const stateData = location.state;
    const cartFromState = stateData?.cart || cart;

    const cartItems = useMemo(() => {
        return stateData?.cartItems || getCartItems();
    }, [stateData?.cartItems, getCartItems]);

    const [customerName, setCustomerName] = useState('');
    const [billerName, setBillerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [manualDiscountAmount, setManualDiscountAmount] = useState(0);
    const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'amount'
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

    const calculatedValues = useMemo(() => {
        const subtotal = cartItems.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity, 10) || 0;
            return sum + (price * quantity);
        }, 0);

        let discountAmount = 0;
        
        if (discountType === 'percentage') {
            discountAmount = (subtotal * discountPercentage) / 100;
        } else {
            discountAmount = Math.min(manualDiscountAmount, subtotal); // Can't discount more than subtotal
        }

        const total = Math.max(0, subtotal - discountAmount); // Ensure total is not negative

        return {
            subtotal: Number(subtotal.toFixed(2)),
            discountAmount: Number(discountAmount.toFixed(2)),
            total: Number(total.toFixed(2))
        };
    }, [cartItems, discountPercentage, manualDiscountAmount, discountType]);

    // Form validation
    const validateForm = () => {
        if (!customerName.trim()) {
            showAlert('error', 'Please enter customer name');
            return false;
        }

        if (!customerPhone.trim()) {
            showAlert('error', 'Please enter phone number');
            return false;
        }

        // Phone number validation
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(customerPhone.replace(/\D/g, ''))) {
            showAlert('warning', 'Please enter a valid 10-digit phone number');
            return false;
        }

        if (!billerName.trim()) {
            showAlert('error', 'Please enter biller name');
            return false;
        }

        if (!paymentMethod.trim()) {
            showAlert('error', 'Please select payment method');
            return false;
        }

        return true;
    };

    // Handle input changes with formatting
    const handleNameChange = (setter, value, fieldName) => {
        const titleCaseValue = toTitleCase(value);
        setter(titleCaseValue);
    };

    const handlePhoneChange = (value) => {
        // Remove all non-digits
        const digitsOnly = value.replace(/\D/g, '');
        // Limit to 10 digits
        const limitedDigits = digitsOnly.slice(0, 10);
        setCustomerPhone(limitedDigits);
    };

    const handleDiscountTypeChange = (type) => {
        setDiscountType(type);
        
        if (type === 'percentage') {
            setManualDiscountAmount(0);
        } else {
            setDiscountPercentage(0);
        }
    };

    const handlePercentageChange = (value) => {
        setDiscountPercentage(value);
    };

    const handleManualAmountChange = (value) => {
        const numValue = parseFloat(value) || 0;
        const maxDiscount = calculatedValues.subtotal;
        
        if (numValue > maxDiscount) {
            setManualDiscountAmount(maxDiscount);
        }
    };

    // Redirect if no cart data
    if (!cartFromState || !cartItems || cartItems.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center max-w-md mx-auto w-full">
                    <div className="text-4xl sm:text-6xl mb-4">🛒</div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Your Cart is Empty</h2>
                    <p className="text-gray-600 mb-6 text-sm sm:text-base">Add some amazing products to get started!</p>
                    <button
                        onClick={() => {
                            showAlert('info', 'Redirecting to products...');
                            setTimeout(() => navigate('/'), 1000);
                        }}
                        className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 w-full sm:w-auto"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    const handleCheckout = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        showAlert('info', 'Processing your order...');

        try {
            const billData = {
                customer_name: customerName,
                phone_number: customerPhone,
                billed_by: billerName,
                payment_method: paymentMethod.toLowerCase(),
                items: cartItems.map(item => ({
                    product_id: item.id,
                    quantity: parseInt(item.quantity, 10),
                    unit_price: parseFloat(item.price),
                    total_price: parseFloat(item.price) * parseInt(item.quantity, 10)
                })),
                discount_percentage: discountType === 'percentage' ? discountPercentage : 0,
                discount_amount: discountType === 'amount' ? manualDiscountAmount : 0,
                total_amount: calculatedValues.total
            };

            await billsAPI.create(billData);
            clearCart(); // Clear Zustand cart
            showAlert('success', `🎉 Order placed successfully for ${toTitleCase(customerName)}!`);
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 2000);

        } catch (error) {
            console.error('Error creating bill:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
            showAlert('error', `Failed to place order: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const navigateBackToProducts = () => {
        setCart(cartFromState);
        showAlert('info', 'Returning to products page...');
        setTimeout(() => navigate('/'), 1000);
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100" style={{ minHeight: '100vh' }}>
            {/* Alert Component */}
            <Alert
                isOpen={alert.isOpen}
                severity={alert.severity}
                message={alert.message}
                onClose={closeAlert}
                position="top"
                duration={4000}
            />
            
            {/* Main Scrollable Container - Force scroll */}
            <div 
                className="w-full"
                style={{ 
                    height: '100vh', 
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingBottom: '50px'
                }}
            >
                <div style={{ minHeight: '100%'}}>
                    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
                        
                        {/* Content Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 lg:gap-6">
                            
                            {/* Left Column - Form Section */}
                            <div className="flex flex-col space-y-4 sm:space-y-5">
                                
                                {/* Customer Information */}
                                <div className="bg-white rounded-lg shadow-md p-4 sm:p-5">
                                    <div className="flex items-center mb-4">
                                        <div className="bg-blue-100 rounded-full p-2 mr-3 flex-shrink-0">
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-base sm:text-lg font-semibold text-gray-800">Customer Information</h2>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div className="sm:col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Customer Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter customer full name"
                                                value={customerName}
                                                onChange={(e) => handleNameChange(setCustomerName, e.target.value, 'Customer name')}
                                                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                            />
                                        </div>

                                        <div className="sm:col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Phone Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                placeholder="Enter 10-digit phone number"
                                                value={customerPhone}
                                                onChange={(e) => handlePhoneChange(e.target.value)}
                                                maxLength="10"
                                                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                            />
                                            {customerPhone && customerPhone.length === 10 && (
                                                <p className="text-xs text-green-600 mt-1">✓ Valid phone number</p>
                                            )}
                                        </div>

                                        <div className="sm:col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Billed By <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter biller full name"
                                                value={billerName}
                                                onChange={(e) => handleNameChange(setBillerName, e.target.value, 'Biller name')}
                                                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                            />
                                        </div>

                                        <div className="sm:col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Payment Method <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={paymentMethod}
                                                onChange={(e) => {
                                                    setPaymentMethod(e.target.value);
                                                }}
                                                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                            >
                                                <option value="">Select payment method</option>
                                                <option value="cash">Cash</option>
                                                <option value="card">Card</option>
                                                <option value="upi">UPI</option>
                                                <option value="net banking">Net Banking</option>
                                                <option value="wallet">Digital Wallet</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Discount Section */}
                                <div className="bg-white rounded-lg shadow-md p-4 sm:p-5">
                                    <div className="flex items-center mb-4">
                                        <div className="bg-green-100 rounded-full p-2 mr-3 flex-shrink-0">
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                        <h2 className="text-base sm:text-lg font-semibold text-gray-800">Apply Discount</h2>
                                    </div>

                                    <div className="space-y-3 sm:space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDiscountTypeChange('percentage')}
                                                    className={`p-2.5 sm:p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                                        discountType === 'percentage'
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-center">
                                                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                        </svg>
                                                        <span className="text-center">Percentage (%)</span>
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDiscountTypeChange('amount')}
                                                    className={`p-2.5 sm:p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                                        discountType === 'amount'
                                                            ? 'border-green-500 bg-green-50 text-green-700'
                                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-center">
                                                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                        </svg>
                                                        <span className="text-center">Fixed Amount (₹)</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Percentage Discount */}
                                        {discountType === 'percentage' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <span>Discount Percentage: {discountPercentage}%</span>
                                                    {discountPercentage > 0 && (
                                                        <span className="text-green-600 ml-2 block sm:inline">
                                                            (Save ₹{((calculatedValues.subtotal * discountPercentage) / 100).toFixed(2)})
                                                        </span>
                                                    )}
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="50"
                                                        value={discountPercentage}
                                                        onChange={(e) => handlePercentageChange(Number(e.target.value))}
                                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                    <div className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-sm font-semibold min-w-12 text-center flex-shrink-0">
                                                        {discountPercentage}%
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Manual Amount Discount */}
                                        {discountType === 'amount' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <span>Discount Amount</span>
                                                    {manualDiscountAmount > 0 && (
                                                        <span className="text-green-600 ml-2 block sm:inline">
                                                            (Save ₹{manualDiscountAmount.toFixed(2)})
                                                        </span>
                                                    )}
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500 font-medium">₹</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={calculatedValues.subtotal}
                                                        step="0.01"
                                                        value={manualDiscountAmount || ''}
                                                        onChange={(e) => handleManualAmountChange(e.target.value)}
                                                        placeholder="Enter discount amount"
                                                        className="w-full pl-8 pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Maximum discount: ₹{calculatedValues.subtotal.toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons - Always at bottom with extra space */}
                                <div className="pt-4 pb-8">
                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                        <button
                                            onClick={navigateBackToProducts}
                                            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium flex items-center justify-center text-sm shadow-sm"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                            </svg>
                                            <span className="hidden sm:inline">Continue Shopping</span>
                                            <span className="sm:hidden">Continue</span>
                                        </button>

                                        <button
                                            onClick={handleCheckout}
                                            disabled={loading}
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center text-sm shadow-lg"
                                        >
                                            {loading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span className="hidden sm:inline">Processing...</span>
                                                    <span className="sm:hidden">Processing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    🛒 
                                                    <span className="ml-1 sm:ml-2">
                                                        <span className="hidden sm:inline">Place Order • </span>
                                                        ₹{calculatedValues.total.toFixed(0)}
                                                        <span className="hidden sm:inline">.{(calculatedValues.total % 1).toFixed(2).slice(2)}</span>
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Order Summary - Fixed Height */}
                            <div className="xl:order-last order-first">
                                <div 
                                    className="bg-white rounded-lg shadow-md xl:sticky xl:top-4"
                                    style={{ maxHeight: '85vh' }}
                                >
                                    {/* Header */}
                                    <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
                                        <div className="flex items-center">
                                            <div className="bg-indigo-100 rounded-full p-2 mr-3 flex-shrink-0">
                                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-base sm:text-lg font-semibold text-gray-800">Order Summary</h2>
                                                <p className="text-xs text-gray-600 mt-0.5">
                                                    {cartItems.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0)} items in cart
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Scrollable Cart Items */}
                                    <div 
                                        className="overflow-y-auto"
                                        style={{ maxHeight: 'calc(85vh - 160px)' }}
                                    >
                                        <div className="p-4">
                                            <div className="space-y-2.5">
                                                {cartItems.map(item => {
                                                    const itemPrice = parseFloat(item.price) || 0;
                                                    const itemQuantity = parseInt(item.quantity, 10) || 0;
                                                    const itemTotal = itemPrice * itemQuantity;

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:shadow-sm transition-shadow"
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1 pr-3">
                                                                    <h3 className="font-semibold text-gray-800 text-sm mb-1 leading-tight">
                                                                        {toTitleCase(item.name)}
                                                                    </h3>
                                                                    <p className="text-xs text-gray-600 mb-2">
                                                                        {toTitleCase(item.brand) || 'No Brand'} • {toTitleCase(item.category)}
                                                                    </p>
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className="text-xs text-blue-600 font-medium">
                                                                            ₹{itemPrice.toFixed(0)}
                                                                            <span className="hidden sm:inline">.{(itemPrice % 1).toFixed(2).slice(2)}</span>
                                                                        </span>
                                                                        <span className="text-xs text-gray-400">×</span>
                                                                        <span className="text-xs text-blue-600 font-medium">
                                                                            {itemQuantity}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-sm font-bold text-gray-800 flex-shrink-0">
                                                                    ₹{itemTotal.toFixed(0)}
                                                                    <span className="hidden sm:inline">.{(itemTotal % 1).toFixed(2).slice(2)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total Section - Fixed at Bottom */}
                                    <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg">
                                        <div className="space-y-2.5">
                                            <div className="flex justify-between text-gray-700">
                                                <span className="font-medium text-sm">Subtotal</span>
                                                <span className="font-semibold text-sm">
                                                    ₹{calculatedValues.subtotal.toFixed(0)}
                                                    <span className="hidden sm:inline">.{(calculatedValues.subtotal % 1).toFixed(2).slice(2)}</span>
                                                </span>
                                            </div>

                                            {calculatedValues.discountAmount > 0 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span className="font-medium text-sm">
                                                        Discount {discountType === 'percentage' 
                                                            ? `(${discountPercentage}%)` 
                                                            : `(₹${manualDiscountAmount.toFixed(0)})`
                                                        }
                                                    </span>
                                                    <span className="font-semibold text-sm">
                                                        -₹{calculatedValues.discountAmount.toFixed(0)}
                                                        <span className="hidden sm:inline">.{(calculatedValues.discountAmount % 1).toFixed(2).slice(2)}</span>
                                                    </span>
                                                </div>
                                            )}

                                            <div className="border-t border-gray-300 pt-2.5 flex justify-between text-base sm:text-lg font-bold text-gray-800">
                                                <span>Total</span>
                                                <span className="text-blue-600">
                                                    ₹{calculatedValues.total.toFixed(0)}
                                                    <span className="hidden sm:inline">.{(calculatedValues.total % 1).toFixed(2).slice(2)}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
