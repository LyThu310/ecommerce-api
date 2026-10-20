const express = require("express");

const {
  createShipment,
  getShipmentById
} = require("../controllers/shipment.controller");

const {
  verifyToken
} = require("../middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken);

router.post("/", createShipment);
router.get("/:id", getShipmentById);

module.exports = router;