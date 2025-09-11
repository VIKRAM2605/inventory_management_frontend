import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      // State
      cart: {},
      products: [],

      // Actions
      setCart: (cart) => set({ cart: { ...cart } }),
      
      getCart: () => get().cart,
      
      setProducts: (products) => set({ products: [...products] }),
      
      getProducts: () => get().products,
      
      getCartItems: () => {
        const { cart, products } = get();
        return Object.entries(cart)
          .map(([productId, quantity]) => {
            const product = products.find(p => p.id === productId);
            if (!product) return null;
            return { 
              ...product, 
              quantity: parseInt(quantity, 10) || 0,
              price: parseFloat(product.price) || 0
            };
          })
          .filter(Boolean);
      },

      getTotalItems: () => {
        const { cart } = get();
        return Object.values(cart).reduce((sum, qty) => {
          return sum + (parseInt(qty, 10) || 0);
        }, 0);
      },

      getTotalValue: () => {
        const { cart, products } = get();
        return Object.entries(cart).reduce((sum, [productId, quantity]) => {
          const product = products.find(p => p.id === productId);
          if (!product) return sum;
          
          const price = parseFloat(product.price) || 0;
          const qty = parseInt(quantity, 10) || 0;
          return sum + (price * qty);
        }, 0);
      },

      // Fixed: Accept either product object or productId
      addToCart: (product) => set((state) => {
        const productId = typeof product === 'object' ? product.id : product;
        const currentQuantity = parseInt(state.cart[productId], 10) || 0;
        return {
          cart: {
            ...state.cart,
            [productId]: currentQuantity + 1
          }
        };
      }),

      // This already expects productId, which is correct
      removeFromCart: (productId) => set((state) => {
        const newCart = { ...state.cart };
        const currentQuantity = parseInt(newCart[productId], 10) || 0;
        
        if (currentQuantity > 1) {
          newCart[productId] = currentQuantity - 1;
        } else {
          delete newCart[productId];
        }
        return { cart: newCart };
      }),

      clearCart: () => set({ cart: {} }),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        cart: state.cart, 
        products: state.products 
      }),
    }
  )
)

export default useCartStore;
