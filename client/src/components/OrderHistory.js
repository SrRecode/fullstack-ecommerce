import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useCart } from '../context/CartContext';

export default function OrderHistory({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userId } = useCart();

  useEffect(() => {
    loadOrders();
  }, [userId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.getUserOrders(userId);
      setOrders(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading orders...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="order-history">
      <button className="btn-back" onClick={onBack}>
        &larr; Back to Shop
      </button>
      <h1>Order History</h1>
      {orders.length === 0 ? (
        <div className="empty">
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <span className="order-id">Order #{order._id.slice(-8)}</span>
                <span className={`order-status status-${order.status}`}>{order.status}</span>
              </div>
              <div className="order-card-body">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <img src={item.imageUrl} alt={item.name} />
                    <span className="order-item-name">{item.name}</span>
                    <span className="order-item-qty">x{item.quantity}</span>
                    <span className="order-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="order-card-footer">
                <span className="order-date">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
                <span className="order-total">Total: ${order.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
