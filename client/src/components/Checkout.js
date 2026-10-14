import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { api } from '../api';

export default function Checkout({ onBack, onOrderComplete }) {
  const { cartItems, cartTotal, userId } = useCart();
  const [shipping, setShipping] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.createOrder(userId, shipping);
      onOrderComplete(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your cart is empty</h2>
        <button className="btn-primary" onClick={onBack}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <button className="btn-back" onClick={onBack}>
        &larr; Back to Cart
      </button>
      <h1>Checkout</h1>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Shipping Address</h2>
          <div className="form-group">
            <label htmlFor="street">Street Address</label>
            <input
              type="text"
              id="street"
              name="street"
              value={shipping.street}
              onChange={handleChange}
              required
              placeholder="123 Main St"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={shipping.city}
                onChange={handleChange}
                required
                placeholder="New York"
              />
            </div>
            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                name="state"
                value={shipping.state}
                onChange={handleChange}
                required
                placeholder="NY"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="zipCode">ZIP Code</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={shipping.zipCode}
                onChange={handleChange}
                required
                placeholder="10001"
              />
            </div>
            <div className="form-group">
              <label htmlFor="country">Country</label>
              <select
                id="country"
                name="country"
                value={shipping.country}
                onChange={handleChange}
                required
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="AU">Australia</option>
              </select>
            </div>
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn-primary btn-place-order" disabled={loading}>
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
        <div className="order-review">
          <h2>Order Review</h2>
          <div className="review-items">
            {cartItems.map((item) => (
              <div key={item.product?._id} className="review-item">
                <img src={item.product?.imageUrl} alt={item.product?.name} />
                <div className="review-item-info">
                  <p className="review-item-name">{item.product?.name}</p>
                  <p className="review-item-qty">Qty: {item.quantity}</p>
                </div>
                <span className="review-item-price">
                  ${(item.product?.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="review-total">
            <strong>Total: ${cartTotal.toFixed(2)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
