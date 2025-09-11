import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBagIcon, DocumentTextIcon, CubeIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Products', icon: ShoppingBagIcon },
    { path: '/checkout', label: 'Checkout', icon: ShoppingCartIcon },
    { path: '/bills', label: 'Bills', icon: DocumentTextIcon },
    { path: '/inventory', label: 'Inventory', icon: CubeIcon }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-white text-xl font-bold">
            RamJi Electrical Shop
          </Link>
          
          <div className="flex space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
