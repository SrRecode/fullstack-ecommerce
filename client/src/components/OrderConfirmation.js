import React from 'react';

export default function OrderConfirmation({ order, onContinueShopping, onViewOrders }) {
  return (
    <div className="order-confirmation">
      <div className="confirmation-icon">&#10003;</div>
      <h1>Order Confirmed!</h1>
      <p className="confirmation-message">
        Thank you for your purchase. Your order has been placed successfully.
      </p>
      <div className="confirmation-details">
        <h2>Order Details</h2>
        <p><strong>Order ID:</strong> {order._id}</p>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
        <div className="confirmation-items">
          <h3>Items Ordered</h3>
          {order.items.map((item, idx) => (
            <div key={idx} className="confirmation-item">
              <span>{item.name}</span>
              <span>Qty: {item.quantity}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="confirmation-actions">
        <button className="btn-primary" onClick={onContinueShopping}>
          Continue Shopping
        </button>
        <button className="btn-secondary" onClick={onViewOrders}>
          View Orders
        </button>
      </div>
    </div>
  );
}
