import React from 'react';
import { useCart } from '../context/CartContext';

export default function Navbar({ onNavigate, currentView }) {
  const { cartCount } = useCart();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <button className="navbar-logo" onClick={() => onNavigate('home')}>
          ShopHub
        </button>
        <div className="navbar-links">
          <button
            className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            Home
          </button>
          <button
            className={`nav-link ${currentView === 'orders' ? 'active' : ''}`}
            onClick={() => onNavigate('orders')}
          >
            Orders
          </button>
          <button
            className={`nav-link cart-link ${currentView === 'cart' ? 'active' : ''}`}
            onClick={() => onNavigate('cart')}
          >
            Cart
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}
