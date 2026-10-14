import React, { useState, useEffect } from 'react';

const CATEGORIES = ['Electronics', 'Clothing', 'Home & Kitchen', 'Sports', 'Accessories'];

export default function CategoryFilter({ selected, onChange }) {
  const [categories, setCategories] = useState(CATEGORIES);

  useEffect(() => {
    setCategories(CATEGORIES);
  }, []);

  return (
    <div className="category-filter">
      <button
        className={`category-btn ${selected === '' ? 'active' : ''}`}
        onClick={() => onChange('')}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          className={`category-btn ${selected === category ? 'active' : ''}`}
          onClick={() => onChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
