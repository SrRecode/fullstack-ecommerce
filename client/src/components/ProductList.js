import React, { useState, useEffect } from 'react';
import { api } from '../api';
import ProductCard from './ProductCard';

export default function ProductList({ searchQuery, category, onProductSelect }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, [searchQuery, category]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      if (searchQuery) params.search = searchQuery;

      const response = await api.getProducts(params);
      setProducts(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading products...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (products.length === 0) return <div className="empty">No products found</div>;

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} onSelect={onProductSelect} />
      ))}
    </div>
  );
}
