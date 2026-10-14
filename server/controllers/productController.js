const Product = require('../models/product');

exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, sort, minPrice, maxPrice } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let products = Product.find(query);

    if (sort) {
      const sortOrder = sort === 'desc' ? -1 : 1;
      products = products.sort({ price: sortOrder });
    }

    const results = await products.exec();
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.seedProducts = async (req, res) => {
  try {
    await Product.deleteMany({});

    const demoProducts = [
      { name: 'Wireless Bluetooth Headphones', description: 'Premium over-ear headphones with active noise cancellation and 30-hour battery life.', price: 149.99, category: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300', stock: 25 },
      { name: 'Organic Cotton T-Shirt', description: 'Soft, breathable organic cotton t-shirt available in multiple colors.', price: 29.99, category: 'Clothing', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300', stock: 100 },
      { name: 'Stainless Steel Water Bottle', description: 'Double-wall insulated water bottle that keeps drinks cold for 24 hours or hot for 12 hours.', price: 34.99, category: 'Home & Kitchen', imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300', stock: 50 },
      { name: 'Running Shoes', description: 'Lightweight and cushioned running shoes designed for long-distance comfort.', price: 89.99, category: 'Sports', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300', stock: 40 },
      { name: 'Mechanical Keyboard', description: 'RGB backlit mechanical keyboard with Cherry MX switches.', price: 129.99, category: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=300', stock: 30 },
      { name: 'Ceramic Coffee Mug Set', description: 'Set of 4 handcrafted ceramic mugs in earth tones.', price: 44.99, category: 'Home & Kitchen', imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=300', stock: 60 },
      { name: 'Denim Jacket', description: 'Classic fit denim jacket with vintage wash finish.', price: 79.99, category: 'Clothing', imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=300', stock: 35 },
      { name: 'Yoga Mat', description: 'Extra thick, non-slip yoga mat with carrying strap.', price: 39.99, category: 'Sports', imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300', stock: 80 },
      { name: 'Smart Watch', description: 'Fitness tracking smartwatch with heart rate monitor and GPS.', price: 199.99, category: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300', stock: 20 },
      { name: 'Backpack', description: 'Water-resistant laptop backpack with USB charging port.', price: 59.99, category: 'Accessories', imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300', stock: 45 },
      { name: 'Scented Candle Set', description: 'Set of 3 soy wax candles in lavender, vanilla, and eucalyptus scents.', price: 24.99, category: 'Home & Kitchen', imageUrl: 'https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=300', stock: 70 },
      { name: 'Sunglasses', description: 'UV400 polarized sunglasses with metal frame.', price: 49.99, category: 'Accessories', imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300', stock: 55 },
      { name: 'Gaming Mouse', description: 'High-precision gaming mouse with customizable DPI and RGB lighting.', price: 69.99, category: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1527814050087-37938184797b?w=300', stock: 35 },
      { name: 'Hooded Sweatshirt', description: 'Fleece-lined pullover hoodie with kangaroo pocket.', price: 54.99, category: 'Clothing', imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300', stock: 65 },
      { name: 'Resistance Bands Set', description: 'Set of 5 resistance bands for strength training and physical therapy.', price: 19.99, category: 'Sports', imageUrl: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=300', stock: 90 },
    ];

    const created = await Product.insertMany(demoProducts);
    res.status(201).json({ success: true, count: created.length, message: 'Demo products seeded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
