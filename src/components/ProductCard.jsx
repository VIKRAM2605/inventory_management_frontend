import React from 'react';
import useCartStore from '../stores/useCartStore';

// Utility function to convert strings to title case
function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const ProductCard = ({ product }) => {
  // Get cart state and actions from Zustand store
  const cart = useCartStore((state) => state.cart);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  
  const cartQuantity = parseInt(cart[product.id], 10) || 0;

  console.log('ProductCard render:', {
    productId: product.id,
    productName: product.name,
    cartQuantity,
    totalCart: cart
  });

  // Create properly formatted image URL
  const getImageSrc = () => {
    if (product.image_url && !product.image_url.includes('default-product.jpg')) {
      if (product.image_url.startsWith('http')) {
        return product.image_url;
      }
      return `https://inventory-management-frontend-ocod.onrender.com${product.image_url}`;
    }

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f8fafc"/>
        <rect x="50" y="50" width="300" height="200" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="10,5"/>
        <circle cx="150" cy="120" r="15" fill="#cbd5e1"/>
        <path d="M120 150 L180 120 L220 150 L200 170 L140 170 Z" fill="#94a3b8"/>
        <text x="200" y="220" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">No Image</text>
        <text x="200" y="240" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8" text-anchor="middle">Available</text>
      </svg>
    `)}`;
  };

  const handleAddToCart = () => {
    console.log('Adding to cart:', product.name, 'Current quantity:', cartQuantity);
    if (product.stock_quantity > 0 && cartQuantity < product.stock_quantity) {
      addToCart(product);
    }
  };

  const handleRemoveFromCart = () => {
    console.log('Removing from cart:', product.name, 'Current quantity:', cartQuantity);
    if (cartQuantity > 0) {
      removeFromCart(product.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden 
                    h-[340px] sm:h-[380px] lg:h-[300px]  
                    flex flex-col min-w-[200px] sm:min-w-[220px] lg:min-w-[260px] max-w-[300px] lg:max-w-[280px]">
      
      {/* 🔧 COMPACT: Smaller image for desktop */}
      <div className="relative h-[140px] sm:h-[160px] lg:h-[120px] bg-gray-50 overflow-hidden">
        <img
          src={getImageSrc()}
          alt={product.name}
          crossOrigin="anonymous"
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.target.src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <rect width="400" height="300" fill="#fef2f2"/>
                <text x="200" y="150" font-family="Arial, sans-serif" font-size="16" fill="#dc2626" text-anchor="middle">Image Error</text>
              </svg>
            `)}`;
          }}
        />

        {/* 🔧 COMPACT: Smaller stock badge */}
        <div className={`absolute top-2 right-2 px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-full text-[10px] lg:text-xs font-semibold shadow-sm ${
          product.stock_quantity > 10 
            ? 'bg-green-100 text-green-800' 
            : product.stock_quantity > 0
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {product.stock_quantity > 0 ? `${product.stock_quantity}` : 'Out'}
        </div>
      </div>

      {/* 🔧 COMPACT: Tighter padding and spacing */}
      <div className="p-3 sm:p-4 lg:p-3 flex-1 flex flex-col justify-between">
        <div className="flex-1">
          {/* 🔧 COMPACT: Smaller title height for desktop */}
          <h3 className="font-semibold text-sm sm:text-base lg:text-sm text-gray-800 mb-2 line-clamp-2 leading-tight 
                         min-h-[2.5rem] sm:min-h-[3rem] lg:min-h-[2.2rem]">
            {toTitleCase(product.name)}
          </h3>

          {/* 🔧 COMPACT: Combined brand/category in single line for desktop */}
          <div className="flex items-center justify-between mb-2 lg:mb-1.5">
            <span className="text-xs sm:text-sm lg:text-xs text-blue-600 font-medium truncate max-w-[60%]">
              {toTitleCase(product.brand) || 'No Brand'}
            </span>
            <span className="text-[10px] sm:text-xs lg:text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
              {toTitleCase(product.category)}
            </span>
          </div>

          {/* 🔧 COMPACT: Shorter description for desktop */}
          <p className="text-gray-600 text-xs sm:text-sm lg:text-xs mb-2 lg:mb-1.5 line-clamp-2 lg:line-clamp-1 leading-relaxed 
                        min-h-[3rem] sm:min-h-[3.5rem] lg:min-h-[1.2rem]">
            {product.description 
              ? product.description.charAt(0).toUpperCase() + product.description.slice(1).toLowerCase()
              : 'No description available'
            }
          </p>
        </div>

        {/* 🔧 COMPACT: Tighter bottom section */}
        <div className="space-y-2 lg:space-y-1.5">
          {/* 🔧 COMPACT: Price and SKU with smaller fonts on desktop */}
          <div className="flex items-center justify-between">
            <span className="text-lg sm:text-xl lg:text-lg font-bold text-green-600">₹{product.price}</span>
            <span className="text-[10px] sm:text-xs lg:text-[10px] text-gray-500 font-mono">
              {product.sku?.toUpperCase()}
            </span>
          </div>

          {/* 🔧 COMPACT: Smaller cart controls for desktop */}
          {cartQuantity > 0 ? (
            <div className="flex items-center justify-between bg-blue-50 rounded-md lg:rounded-lg p-2 lg:p-2.5">
              <button
                onClick={handleRemoveFromCart}
                className="w-7 h-7 sm:w-8 sm:h-8 lg:w-7 lg:h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors text-sm font-bold"
                title="Remove one item"
              >
                −
              </button>
              <div className="flex flex-col items-center px-2">
                <span className="font-semibold text-blue-800 text-xs lg:text-xs">
                  {cartQuantity} In Cart
                </span>
                <span className="text-[10px] lg:text-[10px] text-green-600 font-bold">
                  ₹{(product.price * cartQuantity).toFixed(0)}
                </span>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={cartQuantity >= product.stock_quantity}
                className="w-7 h-7 sm:w-8 sm:h-8 lg:w-7 lg:h-7 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                title="Add one more item"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className="w-full bg-blue-600 text-white py-2.5 lg:py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 text-sm lg:text-xs"
            >
              {product.stock_quantity === 0 ? 'Out Of Stock' : 'Add To Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
