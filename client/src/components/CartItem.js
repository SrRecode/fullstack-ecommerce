import React from 'react';
import { useCart } from '../context/CartContext';

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  const product = item.product;

  if (!product) return null;

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        <img src={product.imageUrl} alt={product.name} />
      </div>
      <div className="cart-item-info">
        <h3>{product.name}</h3>
        <p className="cart-item-category">{product.category}</p>
        <p className="cart-item-price">${product.price.toFixed(2)}</p>
      </div>
      <div className="cart-item-actions">
        <div className="quantity-control">
          <button onClick={() => updateQuantity(product._id, item.quantity - 1)}>-</button>
          <span>{item.quantity}</span>
          <button onClick={() => updateQuantity(product._id, Math.min(product.stock, item.quantity + 1))}>+</button>
        </div>
        <p className="cart-item-total">${(product.price * item.quantity).toFixed(2)}</p>
        <button className="btn-remove" onClick={() => removeFromCart(product._id)}>
          Remove
        </button>
      </div>
    </div>
  );
}
