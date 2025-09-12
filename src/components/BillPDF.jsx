import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { shopAPI } from '../services/api';

const BillPDF = ({ bill, onClose }) => {
  const [shopSettings, setShopSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔑 CRITICAL: Lock body scroll when modal is open
  useEffect(() => {
    // Store original body styles
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    
    // Lock background scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.bottom = '0';
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
    };
  }, []);

  useEffect(() => {
    const fetchShopSettings = async () => {
      try {
        console.log('Fetching shop settings...');
        const response = await shopAPI.getSettings();
        console.log('Shop settings fetched successfully:', response.data);
        setShopSettings(response.data);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch shop settings:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        setError(error.message);

        // Use default settings as fallback
        setShopSettings({
          shop_name: 'Ramji Electronics',
          address_line1: 'Near New Police station,old bus stand',
          address_line2: 'Perambalur, Tamil Nadu - 621212',
          phone: '+91 9786359161',
          email: 'info@sparkelectronics.com',
          website: 'www.sparkelectronics.com',
          gst_number: '29ABCDE1234F1Z5'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShopSettings();
  }, []);

  const generateFormattedPDF = async () => {
    try {
      console.log('Starting PDF generation...');
      const element = document.getElementById('bill-content');

      if (!element) {
        throw new Error('Bill content element not found');
      }
      console.log('Capturing element as canvas...');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      console.log('Canvas created, generating PDF...');
      const imgData = canvas.toDataURL('image/png');

      const doc = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      console.log('Saving PDF...');
      const fileName = `invoice-${bill?.id?.substring(0, 8) || 'unknown'}.pdf`;
      doc.save(fileName);
      console.log('PDF generated successfully');
    } catch (error) {
      console.error('Detailed PDF generation error:', {
        message: error.message,
        stack: error.stack,
        billId: bill?.id
      });
    }
  };

  const printBill = () => {
    try {
      const printContent = document.getElementById('bill-content');
      if (!printContent) {
        return;
      }

      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent.outerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    } catch (error) {
      console.error('Print error:', error);
    }
  };

  function toTitleCase(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Safe calculation with fallbacks
  const subtotal = bill?.bill_items?.reduce((sum, item) => {
    const price = parseFloat(item?.total_price) || 0;
    return sum + price;
  }, 0) || 0;

  const discountAmount = (subtotal * (parseFloat(bill?.discount_percentage) || 0)) / 100;
  const finalTotal = subtotal - discountAmount;

  // Safe data extraction with fallbacks
  const safeShopSettings = {
    shop_name: shopSettings?.shop_name || 'Ramji Electronics',
    address_line1: shopSettings?.address_line1 || 'Near New Police station,old bus stand',
    address_line2: shopSettings?.address_line2 || 'Perambalur, Tamil Nadu - 621212',
    phone: shopSettings?.phone || '+91 9786359161',
    email: shopSettings?.email || 'info@sparkelectronics.com',
    website: shopSettings?.website || 'www.sparkelectronics.com',
    gst_number: shopSettings?.gst_number || '29ABCDE1234F1Z5'
  };

  const safeBillData = {
    id: bill?.id || 'N/A',
    customer_name: bill?.customer_name || 'Walk-in Customer',
    customer_phone: bill?.customer_phone || '',
    customer_email: bill?.customer_email || '',
    created_at: bill?.created_at || new Date().toISOString(),
    billed_by: bill?.billed_by || 'System Administrator',
    payment_method: bill?.payment_method || 'cash',
    discount_percentage: parseFloat(bill?.discount_percentage) || 0,
    total_amount: parseFloat(bill?.total_amount) || finalTotal,
    bill_items: bill?.bill_items || []
  };

  // 🔑 CRITICAL: Prevent event bubbling
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // 🔑 CRITICAL: Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 🔑 CRITICAL: Modal content for portal rendering
  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        height: '100vh',
        height: '100dvh',
        width: '100vw',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={handleBackdropClick}
    >
      {loading ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      ) : (
        <>
          {/* Desktop Layout */}
          <div 
            className="hidden lg:flex lg:flex-col bg-white rounded-lg shadow-2xl" 
            style={{
              width: 'min(95vw, 1200px)',
              maxHeight: '95vh',
              maxHeight: '95dvh'
            }}
            onClick={handleModalClick}
          >
            {/* Desktop Header Controls */}
            <div className="flex justify-between items-center p-6 border-b bg-gray-50 rounded-t-lg flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Invoice Preview</h2>
                {error && (
                  <p className="text-xs text-red-500 mt-1">
                    Shop settings error: {error} (using defaults)
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            {/* Desktop: Scrollable PDF Content */}
            <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
              <div id="bill-content" className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
                {/* Header Section */}
                <div className="border-b-2 border-gray-800 pb-6 mb-6">
                  <div className="flex justify-between items-start">
                    <div className="w-2/3">
                      <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        {safeShopSettings.shop_name.toUpperCase()}
                      </h1>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>📍 {safeShopSettings.address_line1}</p>
                        <p>   {safeShopSettings.address_line2}</p>
                        <p className="flex space-x-4">
                          <span>📞 {safeShopSettings.phone}</span>
                          <span>✉️ {safeShopSettings.email}</span>
                        </p>
                        <p>🌐 {safeShopSettings.website}</p>
                        <p><strong>GST No:</strong> {safeShopSettings.gst_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-blue-100 px-4 py-2 rounded-lg border border-blue-300">
                        <h2 className="text-xl font-bold text-blue-800">INVOICE</h2>
                        <p className="text-sm text-blue-600">Original Copy</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bill and Customer Details */}
                <div className="grid grid-cols-2 gap-8 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">Bill To:</h3>
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-800">{toTitleCase(safeBillData.customer_name)}</p>
                      {safeBillData.customer_phone && (
                        <p className="text-sm text-gray-600">📞 {safeBillData.customer_phone}</p>
                      )}
                      {safeBillData.customer_email && (
                        <p className="text-sm text-gray-600">✉️ {safeBillData.customer_email}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">Invoice Details:</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Invoice No:</span>
                        <span className="text-sm font-mono font-medium">#{safeBillData.id.substring(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="text-sm font-medium">{new Date(safeBillData.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Time:</span>
                        <span className="text-sm font-medium">{new Date(safeBillData.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Billed By:</span>
                        <span className="text-sm font-medium text-blue-600">{toTitleCase(safeBillData.billed_by)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Payment:</span>
                        <span className="text-sm font-medium text-green-600">
                          {toTitleCase(safeBillData.payment_method)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-6 overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-400">
                    <thead>
                      <tr className="bg-gray-800 text-white">
                        <th className="border border-gray-400 px-3 py-3 text-left text-sm font-semibold">S.No</th>
                        <th className="border border-gray-400 px-3 py-3 text-left text-sm font-semibold">Product Details</th>
                        <th className="border border-gray-400 px-3 py-3 text-center text-sm font-semibold">Qty</th>
                        <th className="border border-gray-400 px-3 py-3 text-right text-sm font-semibold">Unit Price</th>
                        <th className="border border-gray-400 px-3 py-3 text-right text-sm font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeBillData.bill_items.length > 0 ? safeBillData.bill_items.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-400 px-3 py-3 text-center text-sm">
                            {index + 1}
                          </td>
                          <td className="border border-gray-400 px-3 py-3 text-sm">
                            <div>
                              <p className="font-medium text-gray-800">
                                {toTitleCase(item?.product?.name || item?.products?.name || 'Unknown Product')}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {toTitleCase(item?.product?.brand || item?.products?.brand || 'No Brand')} • {' '}
                                {toTitleCase(item?.product?.category || item?.products?.category || 'General')}
                              </p>
                              {(item?.product?.sku || item?.products?.sku) && (
                                <p className="text-xs text-gray-400 font-mono">
                                  SKU: {(item?.product?.sku || item?.products?.sku).toUpperCase()}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-400 px-3 py-3 text-center text-sm font-medium">
                            {item?.quantity || 0}
                          </td>
                          <td className="border border-gray-400 px-3 py-3 text-right text-sm">
                            ₹{parseFloat(item?.unit_price || 0).toFixed(2)}
                          </td>
                          <td className="border border-gray-400 px-3 py-3 text-right text-sm font-medium">
                            ₹{parseFloat(item?.total_price || 0).toFixed(2)}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="border border-gray-400 px-3 py-3 text-center text-sm text-gray-500">
                            No items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary Section */}
                <div className="flex justify-end mb-6">
                  <div className="w-80">
                    <table className="w-full border border-gray-400">
                      <tbody>
                        <tr className="bg-gray-50">
                          <td className="border border-gray-400 px-4 py-2 text-sm font-medium">Items Count:</td>
                          <td className="border border-gray-400 px-4 py-2 text-right text-sm">
                            {safeBillData.bill_items.reduce((sum, item) => sum + parseInt(item?.quantity || 0), 0)} units
                          </td>
                        </tr>
                        <tr className="bg-white">
                          <td className="border border-gray-400 px-4 py-2 text-sm font-medium">Subtotal:</td>
                          <td className="border border-gray-400 px-4 py-2 text-right text-sm">
                            ₹{subtotal.toFixed(2)}
                          </td>
                        </tr>
                        {safeBillData.discount_percentage > 0 && (
                          <tr className="bg-green-50">
                            <td className="border border-gray-400 px-4 py-2 text-sm font-medium text-green-700">
                              Discount ({safeBillData.discount_percentage}%):
                            </td>
                            <td className="border border-gray-400 px-4 py-2 text-right text-sm text-green-700">
                              -₹{discountAmount.toFixed(2)}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-gray-800 text-white">
                          <td className="border border-gray-400 px-4 py-3 text-base font-bold">
                            Grand Total:
                          </td>
                          <td className="border border-gray-400 px-4 py-3 text-right text-lg font-bold">
                            ₹{safeBillData.total_amount.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Terms and Footer */}
                <div className="border-t border-gray-300 pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-8 text-xs text-gray-600">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Terms & Conditions:</h4>
                      <ul className="space-y-1">
                        <li>• All sales are final unless defective</li>
                        <li>• Warranty as per manufacturer terms</li>
                        <li>• Return within 7 days with receipt</li>
                        <li>• Goods once sold cannot be exchanged</li>
                      </ul>
                    </div>
                    <div className="text-right">
                      <h4 className="font-semibold text-gray-800 mb-2">Authorized Signature:</h4>
                      <p className="mt-3 text-sm mr-10">{toTitleCase(safeBillData.billed_by)}</p>
                      <div className="mt-2 border-b border-gray-400 w-32 ml-auto"></div>
                    </div>
                  </div>

                  <div className="text-center pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-blue-600">
                      Thank you for shopping with {safeShopSettings.shop_name}!
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Visit us again for all your electronic needs</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="flex space-x-3 p-6 bg-gray-50 rounded-b-lg border-t flex-shrink-0">
              <button
                onClick={generateFormattedPDF}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center text-base"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
              <button
                onClick={printBill}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center text-base"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Invoice
              </button>
              <button
                onClick={onClose}
                className="bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors font-medium text-base"
              >
                Close
              </button>
            </div>
          </div>

          {/* Mobile Layout */}
          <div 
            className="block lg:hidden bg-white rounded-lg shadow-2xl"
            style={{
              width: 'min(95vw, 600px)',
              maxHeight: '95vh',
              maxHeight: '95dvh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={handleModalClick}
          >
            {/* Mobile Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 border-b bg-gray-50 rounded-t-lg space-y-2 sm:space-y-0 flex-shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Invoice Preview</h2>
                {error && (
                  <p className="text-xs text-red-500 mt-1">
                    Shop settings error: {error} (using defaults)
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 self-end sm:self-auto"
              >
                ×
              </button>
            </div>

            {/* Mobile: Scrollable PDF Content */}
            <div 
              className="flex-1 overflow-y-auto p-4 sm:p-6" 
              style={{ 
                minHeight: 0,
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
                {/* Mobile Header Section */}
                <div className="border-b-2 border-gray-800 pb-4 sm:pb-6 mb-4 sm:mb-6">
                  <div className="flex flex-col space-y-4">
                    <div className="w-full">
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                        {safeShopSettings.shop_name.toUpperCase()}
                      </h1>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <p>📍 {safeShopSettings.address_line1}</p>
                        <p>   {safeShopSettings.address_line2}</p>
                        <p className="flex flex-col sm:flex-row sm:space-x-4 space-y-1 sm:space-y-0">
                          <span>📞 {safeShopSettings.phone}</span>
                          <span>✉️ {safeShopSettings.email}</span>
                        </p>
                        <p>🌐 {safeShopSettings.website}</p>
                        <p><strong>GST No:</strong> {safeShopSettings.gst_number}</p>
                      </div>
                    </div>
                    <div className="w-full text-center sm:text-right">
                      <div className="bg-blue-100 px-3 sm:px-4 py-2 rounded-lg border border-blue-300 inline-block">
                        <h2 className="text-lg sm:text-xl font-bold text-blue-800">INVOICE</h2>
                        <p className="text-xs sm:text-sm text-blue-600">Original Copy</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Bill and Customer Details */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 border-b border-gray-300 pb-1">Bill To:</h3>
                    <div className="space-y-1 sm:space-y-2">
                      <p className="text-base sm:text-lg font-medium text-gray-800">{toTitleCase(safeBillData.customer_name)}</p>
                      {safeBillData.customer_phone && (
                        <p className="text-xs sm:text-sm text-gray-600">📞 {safeBillData.customer_phone}</p>
                      )}
                      {safeBillData.customer_email && (
                        <p className="text-xs sm:text-sm text-gray-600">✉️ {safeBillData.customer_email}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 border-b border-gray-300 pb-1">Invoice Details:</h3>
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Invoice No:</span>
                        <span className="text-xs sm:text-sm font-mono font-medium">#{safeBillData.id.substring(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Date:</span>
                        <span className="text-xs sm:text-sm font-medium">{new Date(safeBillData.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Time:</span>
                        <span className="text-xs sm:text-sm font-medium">{new Date(safeBillData.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Billed By:</span>
                        <span className="text-xs sm:text-sm font-medium text-blue-600">{toTitleCase(safeBillData.billed_by)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Payment:</span>
                        <span className="text-xs sm:text-sm font-medium text-green-600">
                          {toTitleCase(safeBillData.payment_method)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Items Table */}
                <div className="mb-4 sm:mb-6 overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-400 min-w-[500px]">
                    <thead>
                      <tr className="bg-gray-800 text-white">
                        <th className="border border-gray-400 px-2 py-2 text-left text-xs font-semibold">S.No</th>
                        <th className="border border-gray-400 px-2 py-2 text-left text-xs font-semibold">Product Details</th>
                        <th className="border border-gray-400 px-2 py-2 text-center text-xs font-semibold">Qty</th>
                        <th className="border border-gray-400 px-2 py-2 text-right text-xs font-semibold">Unit Price</th>
                        <th className="border border-gray-400 px-2 py-2 text-right text-xs font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeBillData.bill_items.length > 0 ? safeBillData.bill_items.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-400 px-2 py-2 text-center text-xs">
                            {index + 1}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-xs">
                            <div>
                              <p className="font-medium text-gray-800">
                                {toTitleCase(item?.product?.name || item?.products?.name || 'Unknown Product')}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-1">
                                {toTitleCase(item?.product?.brand || item?.products?.brand || 'No Brand')} • {' '}
                                {toTitleCase(item?.product?.category || item?.products?.category || 'General')}
                              </p>
                              {(item?.product?.sku || item?.products?.sku) && (
                                <p className="text-[10px] text-gray-400 font-mono">
                                  SKU: {(item?.product?.sku || item?.products?.sku).toUpperCase()}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-center text-xs font-medium">
                            {item?.quantity || 0}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-right text-xs">
                            ₹{parseFloat(item?.unit_price || 0).toFixed(2)}
                          </td>
                          <td className="border border-gray-400 px-2 py-2 text-right text-xs font-medium">
                            ₹{parseFloat(item?.total_price || 0).toFixed(2)}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="border border-gray-400 px-2 py-2 text-center text-xs text-gray-500">
                            No items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Summary Section */}
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="w-full sm:w-80">
                    <table className="w-full border border-gray-400">
                      <tbody>
                        <tr className="bg-gray-50">
                          <td className="border border-gray-400 px-3 py-2 text-xs sm:text-sm font-medium">Items Count:</td>
                          <td className="border border-gray-400 px-3 py-2 text-right text-xs sm:text-sm">
                            {safeBillData.bill_items.reduce((sum, item) => sum + parseInt(item?.quantity || 0), 0)} units
                          </td>
                        </tr>
                        <tr className="bg-white">
                          <td className="border border-gray-400 px-3 py-2 text-xs sm:text-sm font-medium">Subtotal:</td>
                          <td className="border border-gray-400 px-3 py-2 text-right text-xs sm:text-sm">
                            ₹{subtotal.toFixed(2)}
                          </td>
                        </tr>
                        {safeBillData.discount_percentage > 0 && (
                          <tr className="bg-green-50">
                            <td className="border border-gray-400 px-3 py-2 text-xs sm:text-sm font-medium text-green-700">
                              Discount ({safeBillData.discount_percentage}%):
                            </td>
                            <td className="border border-gray-400 px-3 py-2 text-right text-xs sm:text-sm text-green-700">
                              -₹{discountAmount.toFixed(2)}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-gray-800 text-white">
                          <td className="border border-gray-400 px-3 py-2 text-sm font-bold">
                            Grand Total:
                          </td>
                          <td className="border border-gray-400 px-3 py-2 text-right text-base font-bold">
                            ₹{safeBillData.total_amount.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Terms and Footer */}
                <div className="border-t border-gray-300 pt-3 sm:pt-4 space-y-3">
                  <div className="grid grid-cols-1 gap-4 text-xs text-gray-600">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Terms & Conditions:</h4>
                      <ul className="space-y-1">
                        <li>• All sales are final unless defective</li>
                        <li>• Warranty as per manufacturer terms</li>
                        <li>• Return within 7 days with receipt</li>
                        <li>• Goods once sold cannot be exchanged</li>
                      </ul>
                    </div>
                    <div className="text-center sm:text-right">
                      <h4 className="font-semibold text-gray-800 mb-2">Authorized Signature:</h4>
                      <p className="mt-3 text-sm">{toTitleCase(safeBillData.billed_by)}</p>
                      <div className="mt-2 border-b border-gray-400 w-32 mx-auto sm:ml-auto sm:mr-0"></div>
                    </div>
                  </div>

                  <div className="text-center pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-blue-600">
                      Thank you for shopping with {safeShopSettings.shop_name}!
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Visit us again for all your electronic needs</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 p-3 sm:p-4 bg-gray-50 rounded-b-lg border-t flex-shrink-0">
              <button
                onClick={generateFormattedPDF}
                className="flex-1 bg-blue-600 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
              <button
                onClick={printBill}
                className="flex-1 bg-green-600 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Invoice
              </button>
              <button
                onClick={onClose}
                className="bg-gray-300 text-gray-700 py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-gray-400 transition-colors font-medium text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // 🔑 CRITICAL: Render modal using React Portal to bypass scroll containers
  return createPortal(modalContent, document.body);
};

export default BillPDF;
