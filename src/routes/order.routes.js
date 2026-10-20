const express = require("express");

const {
  createOrder,
  getOrders,
  getOrderById
} = require("../controllers/order.controller");

const {
  verifyToken
} = require("../middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken);

router.get("/", getOrders);
router.get("/:id", getOrderById);
router.post("/", createOrder);

module.exports = router;