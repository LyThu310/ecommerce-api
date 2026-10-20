const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({
  adapter
});

const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        pid: "asc"
      }
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const pid = Number(req.params.id);

    if (!Number.isInteger(pid)) {
      return res.status(400).json({
        message: "Invalid product id"
      });
    }

    const product = await prisma.product.findUnique({
      where: {
        pid: pid
      }
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const { pname, price, quantity } = req.body;

    if (!pname || price === undefined || quantity === undefined) {
      return res.status(400).json({
        message: "pname, price and quantity are required"
      });
    }

    const numericPrice = Number(price);
    const numericQuantity = Number(quantity);

    if (
      Number.isNaN(numericPrice) ||
      numericPrice < 0 ||
      !Number.isInteger(numericQuantity) ||
      numericQuantity < 0
    ) {
      return res.status(400).json({
        message: "Invalid price or quantity"
      });
    }

    const product = await prisma.product.create({
      data: {
        pname: pname,
        price: numericPrice,
        quantity: numericQuantity
      }
    });

    return res.status(201).json({
      message: "Product created successfully",
      product: product
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const pid = Number(req.params.id);
    const { pname, price, quantity } = req.body;

    if (!Number.isInteger(pid)) {
      return res.status(400).json({
        message: "Invalid product id"
      });
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        pid: pid
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    if (!pname || price === undefined || quantity === undefined) {
      return res.status(400).json({
        message: "pname, price and quantity are required"
      });
    }

    const numericPrice = Number(price);
    const numericQuantity = Number(quantity);

    if (
      Number.isNaN(numericPrice) ||
      numericPrice < 0 ||
      !Number.isInteger(numericQuantity) ||
      numericQuantity < 0
    ) {
      return res.status(400).json({
        message: "Invalid price or quantity"
      });
    }

    const updatedProduct = await prisma.product.update({
      where: {
        pid: pid
      },
      data: {
        pname: pname,
        price: numericPrice,
        quantity: numericQuantity
      }
    });

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const pid = Number(req.params.id);

    if (!Number.isInteger(pid)) {
      return res.status(400).json({
        message: "Invalid product id"
      });
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        pid: pid
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    await prisma.product.delete({
      where: {
        pid: pid
      }
    });

    return res.status(200).json({
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};