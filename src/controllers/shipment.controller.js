const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({
  adapter
});

const createShipment = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { oid, status } = req.body;

    if (!Number.isInteger(oid) || !status) {
      return res.status(400).json({
        message: "oid and status are required"
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        oid: oid,
        uid: uid
      }
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    const shipment = await prisma.shipment.create({
      data: {
        oid: oid,
        status: status
      }
    });

    return res.status(201).json({
      message: "Shipment created successfully",
      shipment: shipment
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const getShipmentById = async (req, res) => {
  try {
    const uid = req.user.uid;
    const shipid = Number(req.params.id);

    if (!Number.isInteger(shipid)) {
      return res.status(400).json({
        message: "Invalid shipment id"
      });
    }

    const shipment = await prisma.shipment.findFirst({
      where: {
        shipid: shipid,
        order: {
          uid: uid
        }
      },
      include: {
        order: true
      }
    });

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found"
      });
    }

    return res.status(200).json(shipment);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports = {
  createShipment,
  getShipmentById
};