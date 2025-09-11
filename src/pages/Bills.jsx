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
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-gray-600">Loading bills...</p>
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
            
            {/* Fixed Header */}
            <div className="flex-shrink-0 px-8 py-3 bg-white border-b border-gray-200">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">Bills & Invoices</h1>
                    <div className="flex items-center space-x-4">
                        <p className="text-sm text-gray-600">
                            Total: <span className="font-semibold">{bills.length}</span> bills
                        </p>
                        <button
                            onClick={() => {
                                showAlert('info', 'Refreshing bills...');
                                fetchBills();
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* SCROLLABLE TABLE CONTAINER */}
            <div className="flex-1 px-8 py-4 pb-20 overflow-hidden">
                <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
                    
                    {/* Fixed Table Header */}
                    <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bill ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Billed By
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                        </table>
                    </div>

                    {/* Scrollable Table Body */}
                    <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
                        {bills.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {bills.map((bill) => (
                                        <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                                    #{bill.id.substring(0, 8).toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 font-medium">
                                                    {toTitleCase(bill.customer_name)}
                                                </div>
                                                {bill.phone_number && (
                                                    <div className="text-sm text-gray-500">
                                                        📞 {bill.phone_number}
                                                    </div>
                                                )}
                                                {bill.customer_email && (
                                                    <div className="text-sm text-gray-500">
                                                        ✉️ {bill.customer_email.toLowerCase()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {toTitleCase(bill.billed_by) || 'System Administrator'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="text-sm text-gray-900 font-medium">
                                                    {new Date(bill.created_at).toLocaleDateString('en-IN')}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(bill.created_at).toLocaleTimeString('en-IN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-green-600">
                                                    ₹{parseFloat(bill.total_amount).toFixed(2)}
                                                </div>
                                                {bill.discount_percentage > 0 && (
                                                    <div className="text-xs text-green-500">
                                                        🎉 {bill.discount_percentage}% discount applied
                                                    </div>
                                                )}
                                                {bill.payment_method && (
                                                    <div className="text-xs text-gray-500">
                                                        💳 {toTitleCase(bill.payment_method)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleViewBill(bill)}
                                                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        View Invoice
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Bottom spacer to ensure last item is fully visible */}
                                    <tr>
                                        <td colSpan="6" className="h-4"></td>
                                    </tr>
                                </tbody>
                            </table>
                        ) : (
                            // Empty State
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📄</div>
                                    <p className="text-gray-500 text-lg mb-4">No Bills Found</p>
                                    <p className="text-gray-400 text-sm mb-4">Bills will appear here after customers make purchases</p>
                                    <button
                                        onClick={() => {
                                            showAlert('info', 'Checking for new bills...');
                                            fetchBills();
                                        }}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Check for New Bills
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
