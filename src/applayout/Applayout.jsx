import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Products from '../pages/Products';
import Checkout from '../pages/Checkout';
import Bills from '../pages/Bills';
import Inventory from '../pages/Inventory';

const AppLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="flex-1">
                <Routes>
                    <Route path="/" element={<Products />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/bills" element={<Bills />} />
                    <Route path="/inventory" element={<Inventory />} />
                    {/* Catch all route for 404 */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
        </div>
    );
};

// 404 Component
const NotFound = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
            <div className="bg-white rounded-lg shadow-md p-12">
                <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
                <p className="text-gray-600 mb-8">
                    The page you are looking for doesn't exist or has been moved.
                </p>
                <div className="space-x-4">
                    <a
                        href="/"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
                    >
                        Go to Products
                    </a>
                    <a
                        href="/inventory"
                        className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 inline-block"
                    >
                        Manage Inventory
                    </a>
                </div>
            </div>
        </div>
    );
};


export default AppLayout;
