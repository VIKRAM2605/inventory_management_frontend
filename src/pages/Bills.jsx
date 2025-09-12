import React, { useState, useEffect, useCallback } from 'react';
import { billsAPI } from '../services/api';
import BillPDF from '../components/BillPDF';
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

const Bills = () => {
    const [bills, setBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
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

    // Memoize fetchBills function
    const fetchBills = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            showAlert('info', 'Loading bills...');

            const response = await billsAPI.getAll();
            setBills(response.data);

            if (response.data.length === 0) {
                showAlert('info', 'No bills found in the system');
            } else {
                showAlert('success', `Successfully loaded ${response.data.length} bills`);
            }
        } catch (error) {
            console.error('Error fetching bills:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
            setError(`Failed to load bills: ${errorMessage}`);
            showAlert('error', `Failed to load bills: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Run only on component mount
    useEffect(() => {
        fetchBills();
    }, [fetchBills]);

    const handleViewBill = useCallback((bill) => {
        setSelectedBill(bill);
        showAlert('info', `Opening invoice for ${toTitleCase(bill.customer_name)}`);
    }, []);

    const handleCloseBill = useCallback(() => {
        setSelectedBill(null);
        showAlert('info', 'Invoice closed');
    }, []);

    const handleRetry = () => {
        showAlert('info', 'Retrying to fetch bills...');
        fetchBills();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-gray-600">Loading bills...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
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
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Alert Component */}
            <Alert
                isOpen={alert.isOpen}
                severity={alert.severity}
                message={alert.message}
                onClose={closeAlert}
                position="top"
                duration={4000}
            />

            {/* Fixed Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Bills & Invoices</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Manage and view all customer invoices and billing records
                            </p>
                        </div>
                        <div className="flex sm:flex- space-x-6 row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded-lg flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-sm font-medium">
                                    Total: <span className="font-semibold">{bills.length}</span> bills
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    showAlert('info', 'Refreshing bills...');
                                    fetchBills();
                                }}
                                className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm font-medium shadow-sm hover:shadow-md"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="hidden sm:inline">Refresh Bills</span>
                                <span className="sm:hidden">Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                {/* Desktop Table View - FIXED ALIGNMENT */}
                <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Scrollable Table with Fixed Header */}
                    <div className="max-h-[70vh] overflow-y-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-5">
                                <tr>
                                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bill ID
                                    </th>
                                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer Details
                                    </th>
                                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Staff & Payment
                                    </th>
                                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bills.length > 0 ? (
                                    bills.map((bill) => (
                                        <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono font-semibold inline-block w-fit mb-1">
                                                        #{bill.id.substring(0, 8).toUpperCase()}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        Invoice No.
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 xl:px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {toTitleCase(bill.customer_name)}
                                                    </div>
                                                    {bill.phone_number && (
                                                        <div className="text-xs text-gray-500 flex items-center">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                            {bill.phone_number}
                                                        </div>
                                                    )}
                                                    {bill.customer_email && (
                                                        <div className="text-xs text-gray-500 flex items-center">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                            {bill.customer_email.toLowerCase()}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 xl:px-6 py-4">
                                                <div className="space-y-2">
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                        {toTitleCase(bill.billed_by) || 'System Admin'}
                                                    </span>
                                                    {bill.payment_method && (
                                                        <div className="flex items-center">
                                                            <svg className="w-3 h-3 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                            </svg>
                                                            <span className="text-xs text-gray-600">
                                                                {toTitleCase(bill.payment_method)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-gray-900 flex items-center">
                                                        <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
                                                        </svg>
                                                        {new Date(bill.created_at).toLocaleDateString('en-IN')}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex items-center">
                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {new Date(bill.created_at).toLocaleTimeString('en-IN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-1">
                                                    <div className="text-base font-bold text-green-600 flex items-center">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                        </svg>
                                                        ₹{parseFloat(bill.total_amount).toFixed(2)}
                                                    </div>
                                                    {bill.discount_percentage > 0 && (
                                                        <div className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                                            🎉 {bill.discount_percentage}% discount
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleViewBill(bill)}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center shadow-sm hover:shadow-md"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    View Invoice
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12">
                                            <div className="text-6xl mb-4">📄</div>
                                            <h3 className="text-xl font-medium text-gray-900 mb-2">No Bills Found</h3>
                                            <p className="text-gray-500 text-base mb-6">
                                                Bills will appear here after customers make purchases
                                            </p>
                                            <button
                                                onClick={() => {
                                                    showAlert('info', 'Checking for new bills...');
                                                    fetchBills();
                                                }}
                                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
                                            >
                                                Check for New Bills
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="block lg:hidden">
                    <div className='space-y-4 max-h-[70vh] overflow-y-auto pr-1'>
                    {bills.length > 0 ? (
                        bills.map((bill) => (
                            <div key={bill.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-mono font-semibold">
                                            #{bill.id.substring(0, 8).toUpperCase()}
                                        </span>
                                        <div className="text-lg font-semibold text-gray-900 mt-2">
                                            {toTitleCase(bill.customer_name)}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-green-600">
                                            ₹{parseFloat(bill.total_amount).toFixed(2)}
                                        </div>
                                        {bill.discount_percentage > 0 && (
                                            <div className="text-xs text-green-500 bg-green-50 px-2 py-1 rounded-full mt-1">
                                                🎉 {bill.discount_percentage}% off
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Details Grid */}
                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                    <div className="bg-gray-50 p-2 rounded-lg">
                                        <p className="text-gray-500 text-xs mb-1">Date:</p>
                                        <p className="font-medium">{new Date(bill.created_at).toLocaleDateString('en-IN')}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-lg">
                                        <p className="text-gray-500 text-xs mb-1">Time:</p>
                                        <p className="font-medium">
                                            {new Date(bill.created_at).toLocaleTimeString('en-IN', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-lg">
                                        <p className="text-gray-500 text-xs mb-1">Staff:</p>
                                        <p className="font-medium text-purple-600 text-xs">
                                            {toTitleCase(bill.billed_by) || 'System Admin'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-lg">
                                        <p className="text-gray-500 text-xs mb-1">Payment:</p>
                                        <p className="font-medium text-green-600 text-xs flex items-center">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                            {toTitleCase(bill.payment_method)}
                                        </p>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                {(bill.phone_number || bill.customer_email) && (
                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-xs font-medium text-blue-800 mb-2">Contact Information:</p>
                                        <div className="space-y-1 text-xs text-blue-600">
                                            {bill.phone_number && (
                                                <p className="flex items-center">
                                                    <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    {bill.phone_number}
                                                </p>
                                            )}
                                            {bill.customer_email && (
                                                <p className="flex items-center">
                                                    <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    {bill.customer_email.toLowerCase()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Action Button */}
                                <button
                                    onClick={() => handleViewBill(bill)}
                                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center shadow-sm hover:shadow-md"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View Invoice
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-lg shadow-md text-center py-12">
                            <div className="text-4xl mb-4">📄</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Bills Found</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Bills will appear here after customers make purchases
                            </p>
                            <button
                                onClick={() => {
                                    showAlert('info', 'Checking for new bills...');
                                    fetchBills();
                                }}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
                            >
                                Check for New Bills
                            </button>
                        </div>
                    )}
                    </div>
                </div>
            </div>

            {/* Bill PDF Modal */}
            {selectedBill && (
                <BillPDF
                    bill={selectedBill}
                    onClose={handleCloseBill}
                />
            )}
        </div>
    );
};

export default Bills;
