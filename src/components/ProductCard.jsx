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
      addToCart(product); // Pass the product object
    }
  };

  const handleRemoveFromCart = () => {
    console.log('Removing from cart:', product.name, 'Current quantity:', cartQuantity);
    if (cartQuantity > 0) {
      removeFromCart(product.id); // Pass the product ID
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 overflow-hidden h-[400px] sm:h-[440px] lg:h-[480px] flex flex-col w-full min-w-[280px] sm:min-w-[300px] lg:min-w-[320px] max-w-[400px]">
      {/* Product Image - Better proportions */}
      <div className="relative h-[160px] sm:h-[180px] lg:h-[200px] bg-gray-50 overflow-hidden">
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

        {/* Stock Badge - Better positioning */}
        <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
          product.stock_quantity > 10 
            ? 'bg-green-100 text-green-800' 
            : product.stock_quantity > 0
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
        </div>
      </div>

      {/* Product Info - Better spacing and proportions */}
      <div className="p-4 sm:p-5 lg:p-6 flex-1 flex flex-col justify-between">
        <div className="flex-1">
          {/* Product Name - Better height allocation */}
          <h3 className="font-semibold text-base sm:text-lg lg:text-xl text-gray-800 mb-3 line-clamp-2 leading-tight min-h-[3rem] sm:min-h-[3.5rem]">
            {toTitleCase(product.name)}
          </h3>

          {/* Brand and Category - Better spacing */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm sm:text-base lg:text-lg text-blue-600 font-medium truncate max-w-[65%]">
              {toTitleCase(product.brand) || 'No Brand'}
            </span>
            <span className="text-xs sm:text-sm lg:text-base bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full whitespace-nowrap">
              {toTitleCase(product.category)}
            </span>
          </div>

          {/* Description - Better proportions */}
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg mb-4 line-clamp-3 leading-relaxed min-h-[4rem] sm:min-h-[4.5rem]">
            {product.description 
              ? product.description.charAt(0).toUpperCase() + product.description.slice(1).toLowerCase()
              : 'No description available'
            }
          </p>
        </div>

        {/* Bottom Section - Fixed height */}
        <div className="space-y-4">
          {/* Price and SKU - Better spacing */}
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">₹{product.price}</span>
            <span className="text-xs sm:text-sm lg:text-base text-gray-500 font-mono">
              SKU: {product.sku?.toUpperCase()}
            </span>
          </div>

          {/* Cart Controls - Better proportions */}
          {cartQuantity > 0 ? (
            <div className="flex items-center justify-between bg-blue-50 rounded-xl p-4 lg:p-5">
              <button
                onClick={handleRemoveFromCart}
                className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors text-base lg:text-lg font-bold"
                title="Remove one item"
              >
                −
              </button>
              <div className="flex flex-col items-center px-3 lg:px-4">
                <span className="font-semibold text-blue-800 text-base lg:text-lg">
                  {cartQuantity} In Cart
                </span>
                <span className="text-sm lg:text-base text-green-600 font-bold">
                  ₹{(product.price * cartQuantity).toFixed(0)}
                </span>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={cartQuantity >= product.stock_quantity}
                className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-base lg:text-lg font-bold"
                title="Add one more item"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className="w-full bg-blue-600 text-white py-4 lg:py-5 px-5 lg:px-6 rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 text-base lg:text-lg"
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
