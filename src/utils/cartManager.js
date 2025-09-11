class CartManager {
  constructor() {
    this.cart = {};
    this.products = [];
  }

  setCart(cart) {
    this.cart = { ...cart }; // Create new object to prevent reference issues
  }

  getCart() {
    return { ...this.cart }; // Return copy to prevent mutations
  }

  setProducts(products) {
    this.products = [...products]; // Create copy
  }

  getProducts() {
    return [...this.products]; // Return copy
  }

  getCartItems() {
    return Object.entries(this.cart)
      .map(([productId, quantity]) => {
        const product = this.products.find(p => p.id === productId);
        if (!product) return null;
        return { 
          ...product, 
          quantity: parseInt(quantity, 10) || 0,
          price: parseFloat(product.price) || 0
        };
      })
      .filter(Boolean);
  }

  getTotalItems() {
    return Object.values(this.cart).reduce((sum, qty) => {
      return sum + (parseInt(qty, 10) || 0);
    }, 0);
  }

  getTotalValue() {
    return Object.entries(this.cart).reduce((sum, [productId, quantity]) => {
      const product = this.products.find(p => p.id === productId);
      if (!product) return sum;
      
      const price = parseFloat(product.price) || 0;
      const qty = parseInt(quantity, 10) || 0;
      return sum + (price * qty);
    }, 0);
  }

  clearCart() {
    this.cart = {};
  }
}

export const cartManager = new CartManager();
