const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.createOrder);
router.get('/:userId', orderController.getUserOrders);
router.get('/details/:orderId', orderController.getOrderById);

module.exports = router;
