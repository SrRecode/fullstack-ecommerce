import React, { useState, useCallback } from 'react';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import CategoryFilter from './components/CategoryFilter';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import OrderConfirmation from './components/OrderConfirmation';
import OrderHistory from './components/OrderHistory';

function App() {
  const [view, setView] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lastOrder, setLastOrder] = useState(null);

  const handleViewChange = useCallback((newView) => {
    setView(newView);
    setSelectedProduct(null);
  }, []);

  const handleProductSelect = useCallback((product) => {
    setSelectedProduct(product);
    setView('detail');
  }, []);

  const handleOrderComplete = useCallback((order) => {
    setLastOrder(order);
    setView('confirmation');
  }, []);

  return (
    <CartProvider>
      <div className="app">
        <Navbar onNavigate={handleViewChange} currentView={view} />
        <main className="main-content">
          {view === 'home' && (
            <>
              <div className="hero-section">
                <h1>Welcome to ShopHub</h1>
                <p>Discover amazing products at great prices</p>
              </div>
              <div className="controls-section">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
                <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />
              </div>
              <ProductList
                searchQuery={searchQuery}
                category={selectedCategory}
                onProductSelect={handleProductSelect}
              />
            </>
          )}

          {view === 'detail' && selectedProduct && (
            <ProductDetail
              product={selectedProduct}
              onBack={() => handleViewChange('home')}
            />
          )}

          {view === 'cart' && (
            <Cart onCheckout={() => handleViewChange('checkout')} />
          )}

          {view === 'checkout' && (
            <Checkout
              onBack={() => handleViewChange('cart')}
              onOrderComplete={handleOrderComplete}
            />
          )}

          {view === 'confirmation' && lastOrder && (
            <OrderConfirmation
              order={lastOrder}
              onContinueShopping={() => handleViewChange('home')}
              onViewOrders={() => handleViewChange('orders')}
            />
          )}

          {view === 'orders' && (
            <OrderHistory
              onBack={() => handleViewChange('home')}
              onProductSelect={handleProductSelect}
            />
          )}
        </main>
        <footer className="footer">
          <p>&copy; 2024 ShopHub. All rights reserved.</p>
        </footer>
      </div>
    </CartProvider>
  );
}

export default App;
