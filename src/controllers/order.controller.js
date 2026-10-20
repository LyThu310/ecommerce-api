const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({
  adapter
});

const createOrder = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Order items are required"
      });
    }

    for (const item of items) {
      if (
        !Number.isInteger(item.pid) ||
        !Number.isInteger(item.qty) ||
        item.qty <= 0
      ) {
        return res.status(400).json({
          message: "Invalid product id or quantity"
        });
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const orderDetailsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: {
            pid: item.pid
          }
        });

        if (!product) {
          throw new Error(`PRODUCT_NOT_FOUND:${item.pid}`);
        }

        if (product.quantity < item.qty) {
          throw new Error(`INSUFFICIENT_STOCK:${item.pid}`);
        }

        orderDetailsData.push({
          pid: product.pid,
          qty: item.qty,
          unit_price: product.price
        });
      }

      const newOrder = await tx.order.create({
        data: {
          uid: uid,
          createat: new Date()
        }
      });

      for (const detail of orderDetailsData) {
        await tx.orderDetail.create({
          data: {
            oid: newOrder.oid,
            pid: detail.pid,
            qty: detail.qty,
            unit_price: detail.unit_price
          }
        });

        await tx.product.update({
          where: {
            pid: detail.pid
          },
          data: {
            quantity: {
              decrement: detail.qty
            }
          }
        });
      }

      return tx.order.findUnique({
        where: {
          oid: newOrder.oid
        },
        include: {
          orderDetails: {
            include: {
              product: true
            }
          }
        }
      });
    });

    return res.status(201).json({
      message: "Order created successfully",
      order: order
    });
  } catch (error) {
    console.error(error);

    if (error.message.startsWith("PRODUCT_NOT_FOUND:")) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
      return res.status(400).json({
        message: "Insufficient product stock"
      });
    }

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
const getOrders = async (req, res) => {
  try {
    const uid = req.user.uid;

    const orders = await prisma.order.findMany({
      where: {
        uid: uid
      },
      orderBy: {
        oid: "asc"
      },
      include: {
        orderDetails: {
          include: {
            product: true
          }
        }
      }
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
const getOrderById = async (req, res) => {
  try {
    const uid = req.user.uid;
    const oid = Number(req.params.id);

    if (!Number.isInteger(oid)) {
      return res.status(400).json({
        message: "Invalid order id"
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        oid: oid,
        uid: uid
      },
      include: {
        orderDetails: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
module.exports = {
  createOrder,
  getOrders,
  getOrderById
};