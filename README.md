# Fullstack Ecommerce Application

A complete fullstack ecommerce application built with Express, MongoDB, React, and modern CSS.

## Tech Stack

**Backend:**
- Node.js + Express
- MongoDB with Mongoose
- CORS, dotenv

**Frontend:**
- React 18 (functional components + hooks)
- Context API for cart state
- Fetch API client
- Responsive modern CSS

## Features

- Product catalog with grid layout
- Product detail view
- Category filtering and product search
- Shopping cart (add, remove, update quantity, clear)
- Checkout flow (shipping info, order review)
- Order confirmation page
- Order history
- Seed data endpoint for demo products

## Project Structure

```
fullstack-ecommerce/
├── server/          # Express + MongoDB backend
│   ├── config/      # Database configuration
│   ├── models/      # Mongoose models
│   ├── routes/      # API routes
│   └── controllers/ # Route handlers
└── client/          # React frontend
    ├── public/
    └── src/
        ├── components/  # React components
        └── styles/      # CSS styles
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm start
```

## API Endpoints

### Products
- `GET /api/products` - Get all products (supports `?category=` and `?search=`)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/seed` - Seed demo products

### Cart
- `GET /api/cart/:userId` - Get user cart
- `POST /api/cart/:userId/add` - Add item to cart
- `PUT /api/cart/:userId/update` - Update item quantity
- `DELETE /api/cart/:userId/remove/:productId` - Remove item
- `DELETE /api/cart/:userId/clear` - Clear cart

### Orders
- `POST /api/orders` - Create order from cart
- `GET /api/orders/:userId` - Get user orders
- `GET /api/orders/details/:orderId` - Get order details

### Users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user

## Environment Variables

See `server/.env.example` for required environment variables.
>>>>>>> 80cd02b (feat: complete ecommerce app with product catalog, cart, checkout, and order history)
